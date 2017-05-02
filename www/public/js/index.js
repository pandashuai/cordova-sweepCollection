/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
// This state represents the state of our application and will be saved and
// restored by onResume() and onPause()

var tpl_data = '<div class="ui-ddp-padding-l ui-form-item ui-border-b"><input class="ui-ddp-input" type="text"  value="<%=value%>"><a href="#" class="ui-icon-close"></a></div>';
var tpl_dialog = '<div class="ui-dialog" id="dialogDDP005"><div class="ui-dialog-cnt"><div class="ui-dialog-bd"><div><h4><%=title%></h4><div><%=content%></div></div></div><div class="ui-dialog-ft ui-btn-group"><% for (var i = 0; i < button.length; i++) { %><% if (i == select) { %><button type="button" data-role="button"  class="select"><%=button[i]%></button><% } else { %><button type="button" data-role="button" id="dialogButton<%=i%>"><%=button[i]%></div><% } %><% } %></div></div></div>';

var APP_STORAGE_DATA = 'data';
var APP_STORAGE_URL = 'url';
var APP_STORAGE_PARAM = 'paramName';
var APP_STORAGE_KAY = '$##';
var APP_STORAGE_ARRDATA = ['1.此处是扫描到的结果区', '2.可使用[右上角]的功能进行清除数据区', '3.上传是由GET方法进行,参数可自行定义', '4.需要拍照权限才能扫描', '5.可选中单独数据进行修改', '6.可删除单独数据'];
var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
        // this.onDeviceReady();
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('pause', this.onPause, false);
        document.addEventListener('resume', this.onResume, false);
    },
    onDeviceReady: function() {
        // alert(1);
        ddpOnResume();
        $('#scanCode').on('click', function() {
            cordova.plugins.barcodeScanner.scan(
                function(result) {
                    if (result && result.text) {
                        $('#result').append($.tpl(tpl_data, {
                            value: result.text
                        }));
                        APP_STORAGE_ARRDATA.push(result.text);
                        window.localStorage.setItem(APP_STORAGE_DATA, APP_STORAGE_ARRDATA.join(APP_STORAGE_KAY));
                    }
                },
                function(error) {
                    var err = error;
                    if (typeof(error) == 'string' && $.trim(error) == 'Illegal access') {
                        err = '你禁止了拍照的权限,请允许';
                    }

                    ddpDialog({
                        title: '错误提示',
                        content: err,
                        button: ["关闭"]
                    });
                }, {
                    showFlipCameraButton : true, // iOS and Android
                    showTorchButton : true, // iOS and Android
                    Orientation: "landscape",
                }
            );
        });

        $('#emptied').on('click', function(e) {
            var _this = this;
            ddpDialog({
                title: '警告',
                content: '你确认要清空数据?',
                button: ["确认", "取消"]
            }, clearResult);
        });

        $('#upload').on('click', function() {
            ddpDialog({}, ddpUploadServer, '#upload-dialog');
        });

        $('#result').on('click', '.ui-icon-close', function(e) {
            var index = $(this).parents('.ui-form-item').index();
            APP_STORAGE_ARRDATA.splice(index, 1);
            window.localStorage.setItem(APP_STORAGE_DATA, APP_STORAGE_ARRDATA.join(APP_STORAGE_KAY));
            $(this).parents('.ui-form-item').remove();
        });

        $('#upload-dialog').on('click', '.ui-icon-close', function(e) {
            $(this).siblings('input').val('');
        });
        $('#result').on('input', 'input', function(){
            var index = $(this).parents('.ui-form-item').index();
            APP_STORAGE_ARRDATA[index] = $(this).val();
            window.localStorage.setItem(APP_STORAGE_DATA, APP_STORAGE_ARRDATA.join(APP_STORAGE_KAY));
        });

    },
    onPause: function() {},
    onResume: function(event) {
        ddpOnResume(event);
    }
}



function ddpOnResume(event) {
    $('#result').html('');
    if (window.localStorage.getItem(APP_STORAGE_DATA)) {
        APP_STORAGE_ARRDATA = window.localStorage.getItem(APP_STORAGE_DATA).split(APP_STORAGE_KAY);
    }
    for (var i = 0; i < APP_STORAGE_ARRDATA.length; i++) {
        $('#result').append($.tpl(tpl_data, {
            value: APP_STORAGE_ARRDATA[i]
        }));
    }
    $("#upload-dialog").find('.url').val(window.localStorage.getItem(APP_STORAGE_URL) || '');
    $("#upload-dialog").find('.param').val(window.localStorage.getItem(APP_STORAGE_PARAM) || 'data')
}


function ddpDialog(param, callback, objElement) {
    if (!objElement) {
        param = Object.assign({
            title: '',
            content: '',
            button: ['确认'],
            select: 0
        }, param);
        var html = $.tpl(tpl_dialog, param);
        $('body').append(html);
        var $obj = $('#dialogDDP005');
    } else {
        var $obj = $(objElement);
    }

    $obj.addClass('show');
    $obj.one('click', '[data-role="button"]', function(e) {
        var index = $(this).index();
        if (objElement) {
            $obj.removeClass('show');
        } else {
            $obj.remove();
        }
        if (callback) {
            callback(index, e);
        }
    });
}


function callbaskUpload(index, e) {
    $('#upload').click();
}

function clearResult(index) {
    if (index === 0) {
        $('#result').html('');
        APP_STORAGE_ARRDATA = [];
        window.localStorage.setItem(APP_STORAGE_DATA, '');
    }
}

function ddpUploadServer(index) {
    // 上传
    if (index === 0) {
        var url = $("#upload-dialog").find('.url').val();
        var paramName = $("#upload-dialog").find('.param').val() || 'data';
        var arr = [];
        $('#result').find('.ui-form-item').each(function() {
            var val = $(this).find('input').val();
            if (val) {
                arr.push(val);
            }
        });
        if (!url || arr.length <= 0) {
            ddpDialog({
                title: '提示',
                content: '参数不足, 例如还未有扫描数据！?',
                button: ["关闭"]
            }, callbaskUpload);
            return;
        }
        arr = arr.join(',');
        var dataUrl = {};
        dataUrl[paramName] = arr;
        var $el = $.loading({
            content: '上传中...'
        });
        $.ajax({
            type: 'get',
            url: url,
            data: dataUrl,
            timeout: 300,
            success: function(data) {
                $el.loading("hide");
                window.localStorage.setItem(APP_STORAGE_URL, url || '');
                window.localStorage.setItem(APP_STORAGE_PARAM, paramName || 'data');
                ddpDialog({
                    title: '提示',
                    content: '上传成功，是否删除原有扫描数据?',
                    button: ["是", "否"]
                }, clearResult);
            },
            error: function(xhr, type) {
                $el.loading("hide");
                ddpDialog({
                    title: '警告',
                    content: '未知错误, 请检查！?',
                    button: ["关闭"]
                }, callbaskUpload);
            }
        });
    }
    // 保存参数
    if (index === 1) {
        var url = $("#upload-dialog").find('.url').val() || '';
        var paramName = $("#upload-dialog").find('.param').val() || 'data';
        window.localStorage.setItem(APP_STORAGE_URL, url);
        window.localStorage.setItem(APP_STORAGE_PARAM, paramName);
        ddpDialog({
            title: '提示',
            content: '保存参数成功',
            button: ["关闭"]
        });
    }
    // 取消
    if (index == 2) {
        $("#upload-dialog").find('.url').val(window.localStorage.getItem(APP_STORAGE_URL) || '');
        $("#upload-dialog").find('.param').val(window.localStorage.getItem(APP_STORAGE_PARAM) || 'data');
    }
}

app.initialize();
