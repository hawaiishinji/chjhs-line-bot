var firebase = require('firebase');

var config = {
  apiKey: process.env.FirebaseApiKey,
  authDomain: process.env.FirebaseAuthDomain,
  databaseURL: process.env.FirebaseDatabaseURL,
  projectId: process.env.FirebaseProjectId,
  storageBucket: process.env.FirebaseStorageBucket,
  messagingSenderId: process.env.FirebaseMessagingSenderId
};

firebase.initializeApp(config);
const db = firebase.database();

module.exports = {

  className : 'ECELE1B',

  insertId: function (id) {
    db.ref(`${this.className}/ids/${id}`).set(true);
  }

  ,

  setClassName: function(className){
    this.className = className;
  }
  ,

  removeId: function (id){
    db.ref(`ECELE1B/ids/${id}`).remove();
  }

  ,
  findId : function () {
    // Get the documents collection
    return db.ref(`ECELE1B/ids`).once('value').then((snapshot)=>{
      return Object.keys(snapshot.val());
    });
  }
  ,
  insertContent : function(dayString, contentString){
    db.ref(`ECELE1B/content`).set({dayString: dayString, contentString: contentString});
  }
  ,
  cleanContentDb : function (){
    // Get the documents collection
    db.ref(`ECELE1B/content`).remove();
  }
  ,
  findLastestContent: function () {
    return db.ref(`ECELE1B/content`).once('value').then((snapshot)=>{
      return snapshot.val();
    });
  }



};

