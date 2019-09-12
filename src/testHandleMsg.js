var dbTool = require('./db')
var handleMessage = require('./handleMsg')

var targetId = 'Uf3cfda1e70a640d8df26fef62e3c6d03'
// dbTool.insertId('ECKID3B', targetId)

test()

async function test() {
    await handleMessage(targetId, '小幫手我要關注綿羊班', reply)
    // await handleMessage(targetId, '小幫手我要關注綿羊班', reply)
    // await handleMessage(targetId, '小幫手我要退訂綿羊班', reply)
    await handleMessage(targetId, 'haha', reply)
    await handleMessage(targetId, '小幫手我要退訂綿羊班', reply)

    dbTool.endDb()
}



function reply(msg) {
    return console.log(msg)
}

