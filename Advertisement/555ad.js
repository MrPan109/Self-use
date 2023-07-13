let body = $response.body;
let obj = JSON.parse(body);

// 过滤掉广告
obj.data = obj.data.filter(item => item.layout !== "advert_self");

// 过滤掉 type 为 3 的元素
obj.data.forEach(item => {
    item.list = item.list.filter(subItem => subItem.type !== 3);
});

$done({body: JSON.stringify(obj)});
