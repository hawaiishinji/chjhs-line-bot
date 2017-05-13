

module.exports = {
    insertId: function (db, id, callback) {

        var collection = db.collection('subscribe');
        collection.insert([{id : id }],
            function (err, result) {
                console.log("Inserted 2 documents into the userProfile collection\n");
                callback(result);
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
};


