const {shell, dialog, app} = require('electron')
const util = require('./app-util')
const https = require('https')
const jsdom = require('jsdom')
const appToast = require('./app-toast')

const url = require('./app-constant').url

// 自动检查更新（bool：是否主动操作）
exports.autoUpdateApp = function autoUpdateApp(isTip){
    const req = https.request(url, {}, function (req) {
        let result = '';
        req.on('data', function (data) {
            result += data;
        });
        req.on('end', function () {
            parseHtml(result, isTip);
        });
    })
    req.on('error', (e) => {
        console.error(e);
        dialog.showMessageBoxSync({message: '网络连接异常'})
    });
    req.end();
}

//解析html获取内容
function parseHtml(result, isTip) {
    const dom = new jsdom.JSDOM(result);
    const element = dom.window.document.body.querySelector('div.release-header > ul> li > a[title]')
    if (!(element && element.getAttribute('title'))) {
        if (isTip) {
            appToast.toast({title: '检查更新失败,请前去官网查看', body: ''})
            shell.openExternal(url).then()
        }
        return
    }
    const version = element.getAttribute('title')
    if (util.compareVersion(version, app.getVersion()) > 0) {
        //发现更新
        dialog.showMessageBox({
                                  buttons: ['取消', '更新'],
                                  message: `当前版本：${app.getVersion()}\n发现新版本：${version}`
                              }
        ).then(function (res) {
            if (res.response === 1) {
                shell.openExternal(url).then()
            }
        })
    } else if (isTip) {
        appToast.toast({title: '已经是最新版本', body: ''})
    }
}