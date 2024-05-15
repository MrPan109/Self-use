// 转换时间: 2023/7/25 19:35:48
// 兼容性转换
if (typeof $request !== 'undefined') {
  const lowerCaseRequestHeaders = Object.fromEntries(
    Object.entries($request.headers).map(([k, v]) => [k.toLowerCase(), v])
  );

  $request.headers = new Proxy(lowerCaseRequestHeaders, {
    get: function (target, propKey, receiver) {
      return Reflect.get(target, propKey.toLowerCase(), receiver);
    },
    set: function (target, propKey, value, receiver) {
      return Reflect.set(target, propKey.toLowerCase(), value, receiver);
    },
  });
}
if (typeof $response !== 'undefined') {
  const lowerCaseResponseHeaders = Object.fromEntries(
    Object.entries($response.headers).map(([k, v]) => [k.toLowerCase(), v])
  );

  $response.headers = new Proxy(lowerCaseResponseHeaders, {
    get: function (target, propKey, receiver) {
      return Reflect.get(target, propKey.toLowerCase(), receiver);
    },
    set: function (target, propKey, value, receiver) {
      return Reflect.set(target, propKey.toLowerCase(), value, receiver);
    },
  });
}

/**********************************************

> 应用名称：墨鱼自用555去广告脚本
> 脚本作者：@ddgksf2013
> 微信账号：墨鱼手记
> 更新时间：2023-07-25
> 通知频道：https://t.me/ddgksf2021
> 贡献投稿：https://t.me/ddgksf2013_bot
> 问题反馈：ddgksf2013@163.com
> 特别提醒：如需转载请注明出处，谢谢合作！
> 脚本说明：去除首页轮播图广告、首页信息流广告、我的页面推广


[rewrite_local]

^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v\d\/movie\/index_recommend url script-response-body https://github.com/ddgksf2013/Scripts/raw/master/555Ad.js
^https?:\/\/[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+){1,3}(:\d+)?\/api\/v\d\/advert url reject

[mitm]

hostname = run.api.qyfxgd.cn, *.weilai555.com, *.ecoliving168.com

**********************************************/



















let obj=JSON.parse($response.body);obj.data=obj.data.filter(t=>"advert_self"!==t.layout),obj.data.forEach(t=>{t.list=t.list.filter(t=>3!==t.type)}),$done({body:JSON.stringify(obj)});