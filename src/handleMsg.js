var dbTool = require('./db');
var classes = require('./classes');

module.exports = async function handleMessage(targetId, msg, reply) {

    console.log(`   ${msg}`)

    if (msg.includes('小幫手我要')) {
        const targetClass = checkMsgContainClass(msg)
        if (msg.includes('關注')){
            if (targetClass) {
                if (await findHasSubscribe(targetClass.id, targetId)) {
                    await reply(`您之前就已經關注${targetClass.name}囉`)
                    return
                } else {
                    await subscribe(targetClass.id, targetId)
                    await reply('關注成功')
                    return
                }
            }
        } else if (msg.includes('退訂')) {
            if (targetClass) {
                if (await findHasSubscribe(targetClass.id, targetId)) {
                    await unsubscribe(targetClass.id, targetId)
                    await reply('退訂成功')
                    return
                } else {
                    await reply(`您之前沒有關注過${targetClass.name}喔`)
                    return
                }
            }
        }
    }

    const subscribeSnapshot = await dbTool.findSubscribe(targetId)
    // console.log('subscribe', subscribeSnapshot)

    if (subscribeSnapshot) {
        const classIds = Object.keys(subscribeSnapshot)

        for (var i = 0; i < classIds.length; i ++) {
            const classId = classIds[i]
            const content = await dbTool.findLastestContent(classId)

            if (!content.dayString || content.dayString === '') {
                //do nothing
            } else if (content.dayString !== subscribeSnapshot[classId].dayString) {
                await dbTool.updateIdSubscribeClassDayString(classId, targetId, content.dayString)

                await reply(content.contentString)
            }
        }
    }
}

function subscribe(classId, targetId) {
    return dbTool.insertId(classId, targetId)
}

function unsubscribe(classId, targetId) {
    return dbTool.removeId(classId, targetId)
}

async function findHasSubscribe(classId, targetId) {
    const subscribe = await dbTool.findSubscribe(targetId)
    if (subscribe)
        return Object.keys(subscribe).indexOf(classId) > -1;
    else 
        return false;
}

function checkMsgContainClass(msg) {
    for (var i in classes){
        if (msg.includes(classes[i].name)){
            return classes[i]
        }
    }
}