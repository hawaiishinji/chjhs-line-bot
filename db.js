

module.exports = {
    insertId: function (db, id) {

        return new Promise((resolve, reject) => {
            var collection = db.collection('subscribe');
            collection.insert([{id : id }],
                function (err, result) {

                    if (err != null){
                        reject(error);
                    }

                    console.log("Inserted 2 documents into the userProfile collection\n");
                    resolve(result);
                });
        });
    }

    ,

    removeId: function (db, id){
        return new Promise((resolve, reject) => {
            // Get the documents collection
            var collection = db.collection('subscribe');

            collection.remove({id: id}, function(error, result){
                if (error != null){
                    reject(error);
                }

                resolve(result);
            });
        });
    }

    ,
    findId : function (db, callback) {
        // Get the documents collection
        var collection = db.collection('subscribe');
        // Find some documents
        collection.find({}).toArray(function (err, docs) {
            callback(docs);
        });
    }
    ,
    insertContent : function(db, dayString, contentString, callback){
        // Get the documents collection
        var collection = db.collection('content');

        collection.insert({dayString: dayString, contentString: contentString}, callback);
    }
    ,
    cleanContentDb : function (db){
        // Get the documents collection
        var collection = db.collection('content');
        collection.remove();
    }
    ,
    findLastestDayString : function (db, callback) {
        // Get the documents collection
        var collection = db.collection('content');
        // Find some documents
        collection.find({}).toArray(function (err, docs) {
            callback(docs);
        });
    }



};


