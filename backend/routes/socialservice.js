var express = require('express');
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var router = express.Router();
var cookieParser = require('cookie-parser');

router.use(bodyParser.json());
router.use(cookieParser());

async function asyncForEach(array, callback) { //making async forEach wait
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}


function extractUserInfo(req, res, next, id){
  var db = req.db;
  var collection = db.get('userList');
  var userIdentification = {"_id": ObjectId(id)}
  var filteredResults = {"name":1,"icon":1,"friends":1}
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    
  }); 
  var data  = {};
  
  collection.find(userIdentification, filteredResults, async function(err,records){
		if (err === null){
      data._id = id;
      data.name = records[0].name;
      data.icon = records[0].icon;
      data.friends = [];
      await asyncForEach(records[0].friends, async (friendRecord) => {
        var friend = {};
        friend.friendId = friendRecord.friendId;
        friend.starredOrNot = friendRecord.starredOrNot;
        collection.find({ "_id": ObjectId(friendRecord.friendId) },function(err,records){
          if (err === null){
            friend.name = records[0].name;
            data.friends.push(friend);
          } 
          else {
            res.send({
              msg: err
            });
          }
        });
      });

      data.posts = [];
     
      db.get('postList').find({ "userId": {$ne: id} }, async function(err,records){
        if (err === null){
          await asyncForEach(records, async (record) => {
            var post = {};
            post.post = record.content;
            post.time = record.time;
            post.location = record.location;
            post.userId = record.userId;
            post.id = record._id;
  
            let users = await collection.find({"_id": ObjectId(record.userId)});
            
            users.forEach(async user =>{
                  post.poster = user.name;
                  post.posterAvatar = user.icon;
            });
            
            let comments = await db.get('commentList').find({ "postId": ObjectId(record._id).valueOf().toString(), "deleteTime":"" });
            post.comment = [];
            await asyncForEach(comments, async (comment) => {
                  var Comment = {};
                  Comment.postTime = comment.postTime;
                  Comment.comment = comment.comment;
                  Comment.postId = comment.postId;
                  Comment.userId = comment.userId;
                  Comment.id = comment._id;
                  if(comment.userId === req.cookies.userId){
                    Comment.poster = "You";
                  }
                  else{
                    let commentUser = await collection.find({"_id": ObjectId(Comment.userId)});
                    commentUser.forEach(async user =>{
                      Comment.poster = user.name;
                    });
                  }
                  post.comment.push(Comment);
            });

            post.comment.sort(function(a,b){
              var aDate = a.postTime.split(' ');
              aDate = aDate[0] + " " + aDate[2]+ " " + aDate[3]+ " " + aDate[4];
              var bDate = b.postTime.split(' ');
              bDate = bDate[0] + " " + bDate[2]+ " " + bDate[3]+ " " + bDate[4];
              if(Date.parse(bDate) - Date.parse(aDate) > 0){
                return -1;
              }
              else if(Date.parse(aDate) - Date.parse(bDate) > 0){
                return 1;
              }
              else{
                return 0;
              }
            });

            
            data.posts.push(post);
          });

          data.posts.sort(function(a,b){
            var aDate = a.time.split(' ');
            aDate = aDate[0] + " " + aDate[2]+ " " + aDate[3]+ " " + aDate[4];
            var bDate = b.time.split(' ');
            bDate = bDate[0] + " " + bDate[2]+ " " + bDate[3]+ " " + bDate[4];
            if(Date.parse(bDate) - Date.parse(aDate) > 0){
              return -1;
            }
            else if(Date.parse(aDate) - Date.parse(bDate) > 0){
              return 1;
            }
            else{
              return 0;
            }
          });

          console.log(data.posts);

          var today = new Date();
          var date = today.toDateString();
          var time = ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2) + ":" +("0" + today.getSeconds()).slice(-2);
          var dateTime = time+' '+date;
          let result = await collection.update(userIdentification,{ $set: { "lastCommentRetrievalTime":  dateTime}});
          res.json(data);
          
        } 
        else {
          res.send({
            msg: err
          });
        }
      });
    } 
    else {
      res.send({
        msg: err
      });
		}
	});


};


/*
 * POST to signin.
 */
router.post('/signin', bodyParser.json(), function(req, res, next) {
  var db = req.db;
  var collection = db.get('userList');
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": true
  }); 
  var username = req.body.username;
	var password = req.body.password;
	collection.find({"name": username, "password": password},function(err,records){
		if (err === null){
			if (records.length === 1){
        var cookie_id = records[0]._id + '';
        res.cookie('userId', records[0]._id + '');
        extractUserInfo(req, res, next, cookie_id);//by now the cookie has not been set so we need to send id as paramter
			} else {
        res.send("Login failure");
			}
		} else {
            res.send({
                msg: err
            });
		}
	});
});

/* GET getLoggedInUserInfo */
router.get('/getLoggedInUserInfo', function(req, res, next) {
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": true
  }); 
  if (req.cookies.userId){
    extractUserInfo(req,res,next, req.cookies.userId);
  } else {
    res.send('');
  }
});

/* GET logout */
router.get('/logout', function(req,res,next){
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": true
  }); 

  req.db.get("userList").update({"_id":ObjectId(req.cookies.userId)},{ $set: {"lastCommentRetrievalTime":""}},function(err,records){
    if (err === null){
      res.clearCookie("userId");
      res.send('');
    }
  });
});



/* GET getuserprofile */
router.get('/getuserprofile', function(req,res,next){
  if (req.cookies.userId){
      var db = req.db;
      var collection = db.get('userList');
      res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Credentials": true
      }); 

      collection.find({"_id":ObjectId(req.cookies.userId)},{mobileNumber:1, homeNumber:1, address:1},function(err,records){
          if (err === null){
            res.json(records[0]);
          } else {
              res.send({
                  msg: err
              });
          }
      })
  }
});

/* PUT saveuserinfo */
router.put('/saveuserinfo',bodyParser.json(),function(req,res,next){
  if (req.cookies.userId){
      var db = req.db;
      var collection = db.get('userList');
      var mobileNumber = req.body.mobileNumber;
      var homeNumber = req.body.homeNumber;
      var address = req.body.address;

      res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Credentials": true
      }); 

      collection.update({"_id":ObjectId(req.cookies.userId)},{ $set: {"mobileNumber": mobileNumber,"homeNumber": homeNumber,"address": address}},function(err,records){
          if (err === null){
              res.send('');
          } else {
              res.send({
                  msg: err
              });
          }
      });
  }
});


/* GET updatestar */
router.get('/updatestar/:friendid',async function(req,res,next){
  if (req.cookies.userId){
      var db = req.db;
      var collection = db.get('userList');
      var friendid = req.params.friendid;
      res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Credentials": true
      }); 

      let users = await collection.find({"_id":ObjectId(req.cookies.userId)});
            await users.forEach(async user =>{
              var star_status = "";
              await user.friends.forEach(async friend =>{
                if(friend.friendId == friendid){
                  star_status = friend.starredOrNot;
                }
              });
              if(star_status === "Y"){
                star_status = "N";
              }
              else{
                star_status = "Y";
              }
              let users = await collection.update({"_id":ObjectId(req.cookies.userId), "friends": {$elemMatch: {friendId: friendid}}},{ $set: { "friends.$.starredOrNot": star_status }});
              res.send('');
            });
  }
});


/*
 * POST to postComment.
 */
router.post('/postcomment/:postid', bodyParser.json(), function(req, res, next) {
  var db = req.db;
  var collection = db.get('commentList');
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": true
  });        

  var comment = req.body.comment;
  var postid = req.params.postid;
  var posterid = req.cookies.userId;
  var today = new Date();
  var date = today.toDateString();
  var time = ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2) + ":" +("0" + today.getSeconds()).slice(-2);
  var dateTime = time+' '+date;

	collection.insert({"postId": postid, "userId": posterid, "postTime": dateTime,
  "comment": comment, "deleteTime": ""},function(err,records){
		if (err === null){
				res.send('');
		} else {
        res.send({
          msg: err
        });
		}
	});
});


/* DELETE deletecomment */
router.delete('/deletecomment/:commentid',function(req,res,next){
  var db = req.db;
  var today = new Date();
  var date = today.toDateString();
  var time = ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2) + ":" +("0" + today.getSeconds()).slice(-2);
  var deleteDateTime = time + ' ' + date;
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
  }); 
  db.get('commentList').update({"_id":ObjectId(req.params.commentid)},{ $set: { "deleteTime": deleteDateTime }},function(err,records){
    if (err === null){
        res.send('');
    } else {
        res.send({
            msg: err
        });
    }
  });
});



/* GET loadcommentupdates */
router.get('/loadcommentupdates', async function(req,res,next){
  if (req.cookies.userId){
      var db = req.db;
      var collection = db.get('postList');
     
      res.set({
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Credentials": true
      }); 

      var data = {};

      data.newComments = [];
      data.deletedComments = [];

      var CommentRetrievalTime = "";
      
      let Users = await db.get('userList').find({"_id":ObjectId(req.cookies.userId)});
      await asyncForEach(Users, async (user) => {
        CommentRetrievalTime = user.lastCommentRetrievalTime;
        var parts = CommentRetrievalTime.split(' ');
        CommentRetrievalTime = parts[0] + " " + parts[2]+ " " + parts[3]+ " " + parts[4];
      });

      let posts = await collection.find({ "userId": {$ne: req.cookies.userId} });
      await asyncForEach(posts, async (post) => {
        let comments = await db.get('commentList').find({ "userId": {$ne: req.cookies.userId}, "postId": post._id.toString() });
        await asyncForEach(comments, async (comment) => {
          var date = comment.postTime.split(' ');
          date = date[0] + " " + date[2]+ " " + date[3]+ " " + date[4];
            if(Date.parse(date) - Date.parse(CommentRetrievalTime) >= 0){
              var Comment = {};
              Comment.postTime = comment.postTime;
              Comment.comment = comment.comment;
              Comment.postId = comment.postId;
              Comment.userId = comment.userId;
              Comment.id = comment._id;
              let commentUser = await db.get("userList").find({"_id": ObjectId(Comment.userId)});
              commentUser.forEach(cUser =>{
                Comment.poster = cUser.name;
              });
              data.newComments.push(Comment);
            }
            else if(comment.deleteTime !== ""){
              console.log(comment);
              data.deletedComments.push(comment._id);
            }
          
        });
      });

      data.newComments.sort(function(a,b){
        var aDate = a.postTime.split(' ');
        aDate = aDate[0] + " " + aDate[2]+ " " + aDate[3]+ " " + aDate[4];
        var bDate = b.postTime.split(' ');
        bDate = bDate[0] + " " + bDate[2]+ " " + bDate[3]+ " " + bDate[4];
        if(Date.parse(bDate) - Date.parse(aDate) > 0){
          return -1;
        }
        else if(Date.parse(aDate) - Date.parse(bDate) > 0){
          return 1;
        }
        else{
          return 0;
        }
      });

      if(data.deletedComments !== [] || data.newComments!== []){
        var today = new Date();
        var date = today.toDateString();
        var time = ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2) + ":" +("0" + today.getSeconds()).slice(-2);
        var dateTime = time + ' ' + date;
        let currUser = await db.get('userList').update({"_id":ObjectId(req.cookies.userId)},{ $set: { "lastCommentRetrievalTime": dateTime }});
        console.log(data);
        res.json(data);
      }
      
  }
});

/*
 * Handle preflighted request
 */
router.options("/*", function(req, res, next){
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header("Access-Control-Allow-Credentials", true);
  res.send(200);
});

module.exports = router;
