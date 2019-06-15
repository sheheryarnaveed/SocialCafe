import React from 'react';
import ReactDOM from 'react-dom'; 
import './App.css';
import $ from 'jquery';

class SocialCafe extends React.Component {
  constructor(props) {
    super(props);
    this.handleLoginClick = this.handleLoginClick.bind(this);
    this.handleUserNameChange = this.handleUserNameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.handlefriendStar = this.handlefriendStar.bind(this);
    this.addComment = this.addComment.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
    this.showUserProfile = this.showUserProfile.bind(this);
    this.removeComments = this.removeComments.bind(this);
    this.newComments = this.newComments.bind(this);
    this.state = {
      isLoggedIn: false,
      UserName: "",
      Password: "",
      PostData: [],
      Name: "",
      id: "",
      icon: "",
      friends: [],
      personalDetails: 0,
      authError: false
    };
  }

  componentDidMount() {
   this.loadUserDetails();
  }  

  loadUserDetails(){
    console.log("loadUserDetails");
    $.ajax({
      url: 'http://localhost:3001/socialservice/getLoggedInUserInfo', 
      method: 'get',
      crossDomain: true,
      xhrFields: {withCredentials: true}
    })
		.then(function(success){
			if (success === ""){
				this.setState({isLoggedIn: false});
      }
      else{
        this.setState({
          isLoggedIn: true,
          PostData: success.posts,
          Name: success.name,
          id: success._id,
          icon: success.icon,
          friends: success.friends
        });
      }
		}.bind(this),function(error){
			console.log('Error: ' + error);
		});
  }

  checkLogin() {
    $.ajax({
      url: 'http://localhost:3001/socialservice/signin', 
      method: 'post',
      data: {username: this.state.UserName, password: this.state.Password},
      crossDomain: true,
      xhrFields: {withCredentials: true}
    })
		.then(function(success){
			if (success !== "Login failure"){
        console.log("P");
        this.setState({
          isLoggedIn: true,
          PostData: success.posts,
          Name: success.name,
          id: success._id,
          icon: success.icon,
          friends: success.friends
        });
			} else {
        console.log("F");
				this.setState({
          isLoggedIn: false,
          authError: true,
          
        });
			}
		}.bind(this),function(error){
			console.log('Error: ' + error);
		});
    
  }


  handleUserNameChange(username) {
    this.setState({
      UserName: username
    });
    
  }
  
  handlePasswordChange(password) {
    this.setState({
      Password: password
    });
  }


  handleLoginClick(e) {
    e.preventDefault(e);
    this.checkLogin();
    
  }

  deleteComment(commentId, postId){
    let newPosts = this.state.PostData;
    var deleteComment = {};
    newPosts.map((post) => {
      if(post.id === postId){
          post.comment.map((comment) => {
            if(comment.id === commentId){
              deleteComment = comment;
            }
          });
          post.comment = post.comment.filter(comm => comm !== deleteComment);
      }
    });
    
    this.setState({
       PostData: newPosts   
    });
  }

  addComment(){
    this.loadUserDetails();
  }

  handleLogout(e) {
    e.preventDefault(e);
    $.ajax({
      url: 'http://localhost:3001/socialservice/logout', 
      method: 'get',
      crossDomain: true,
      xhrFields: {withCredentials: true}
    })
		.then(function(success){
			if (success === ""){
				this.setState({
          isLoggedIn: false,
          UserName: "",
          Password: "",
          UserData: [],
          authError: false
        });
			}
		}.bind(this),function(error){
			console.log('Error: ' + error);
		});
  }

  handlefriendStar(id){
    let newFriends = this.state.friends;
    newFriends.map((friend) => {
      if(friend.friendId === id){
        if(friend.starredOrNot === "Y"){
          friend.starredOrNot = "N";
        }
        else{
          friend.starredOrNot = "Y";
        }
      }
    });

    this.setState({
       friends: newFriends   
    });
  }

  removeComments(removedIds){
    console.log("removeComments reached!");
    let newPosts = this.state.PostData;
    var deleteComment = {};
    newPosts.map((post) => {
        post.comment.map((comment) => {
          if($.inArray(comment.id, removedIds) !== -1){
            deleteComment = comment;
          }
        });
        post.comment = post.comment.filter(comm => comm !== deleteComment);
    });
    
    this.setState({
       PostData: newPosts   
    });
  }

  newComments(newComments){
    console.log("newComments reached!");
    let newPosts = this.state.PostData;
    newPosts.map((post) => {
          newComments.map((newComment) => {
            if(newComment.postId === post.id){
              post.comment.push(newComment);
            }
          });
    });
    
    this.setState({
       PostData: newPosts   
    });
  }

  showUserProfile(showVar){
    this.setState({
      personalDetails: showVar   
   });
  }


  render() {
    let view = null;
    if (this.state.isLoggedIn) {
      view = <LoggedInState
        handleLogout={this.handleLogout}
        Name={this.state.Name}
        icon={this.state.icon}
        friends={this.state.friends}
        posts={this.state.PostData}
        triggerStar={this.handlefriendStar} 
        addComment={this.addComment}
        id={this.state.id}
        deleteComment={this.deleteComment}
        showUserProfile={this.showUserProfile}
        personalDetails={this.state.personalDetails}
        removeComments={this.removeComments}
        newComments={this.newComments}
      />;
    } else {
      view = <LoggedOutState
        userName={this.state.UserName}
        password={this.state.Password}
        onUserNameChange={this.handleUserNameChange}
        onPasswordChange={this.handlePasswordChange}
        onLoginClick={this.handleLoginClick}
        authError={this.state.authError}
      />;
    }
    return (
      <div>
      {view}
      </div>
    );
  }
} 

class LoggedOutState extends React.Component {
  constructor(props) {
     super(props);
      //bind this to functions
      this.handleUserNameChange = this.handleUserNameChange.bind(this);
      this.handlePasswordChange = this.handlePasswordChange.bind(this);
      this.handleLoginClick = this.handleLoginClick.bind(this);
  }

  handleUserNameChange(e) {
    e.preventDefault(e);
    this.props.onUserNameChange(e.target.value);
  }
  
  handlePasswordChange(e) {
    e.preventDefault(e);
    this.props.onPasswordChange(e.target.value);
  }
  
  handleLoginClick(e) {
    e.preventDefault(e);
    this.props.onLoginClick(e);
    this.props.onPasswordChange(e.target.value);
    this.props.onUserNameChange(e.target.value);
    $('#Username').val('');
    $('#Password').val('');
  }



  render() {
    let err="";
    if(this.props.authError === true){
      err="Login Authentication Error!";
    }

    return (
    <div className="login">
      <form>
    			<h2>Social Cafe</h2>
    			<p>{err}</p>
        		<label>Username: 
              <input
                id="Username"
                type="text"
                placeholder = "UserName"
                value={this.props.UserName}
                onChange={this.handleUserNameChange}
              />
            </label><br/>
        		<label>Password: 
              <input
                id="Password"
                type="password"
                placeholder = "Password"
                value={this.props.Password}
                onChange={this.handlePasswordChange}
            />
            </label><br/>
        		<button className="myButton" onClick={this.handleLoginClick}>Login</button>
      </form>
		</div>
    );
  }
}


class LoggedInState extends React.Component {
  constructor(props) {
    super(props);
    this.handleLogout = this.handleLogout.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
    this.saveUserProfile = this.saveUserProfile.bind(this);
    this.handleMobileChange = this.handleMobileChange.bind(this);
    this.handleHomeChange = this.handleHomeChange.bind(this);
    this.handleAddressChange = this.handleAddressChange.bind(this);
    this.state = {
      mobileNumber: "",
      homeNumber: "",
      address: ""
    };
  }

  

  saveUserProfile(e){
    e.preventDefault(e);
    $.ajax({
      url: 'http://localhost:3001/socialservice/saveuserinfo', 
      method: 'put',
      data: {mobileNumber: this.state.mobileNumber, homeNumber: this.state.homeNumber, address: this.state.address},
      crossDomain: true,
      xhrFields: {withCredentials: true}
    })
		.then(function(success){
			if (success === ""){
        console.log("adfs");
				this.props.showUserProfile(0);
			}
		}.bind(this),function(error){
			console.log('Error: ' + error);
		});
  }


  getUserProfile(e){
    e.preventDefault(e);
    $.ajax({
      url: 'http://localhost:3001/socialservice/getuserprofile', 
      method: 'get',
      crossDomain: true,
      xhrFields: {withCredentials: true}
    })
		.then(function(success){
      this.setState({
        mobileNumber: success.mobileNumber, 
        homeNumber: success.homeNumber, 
        address: success.address
      });
			this.props.showUserProfile(1);
		}.bind(this),function(error){
			console.log('Error: ' + error);
		});
  }

  handleMobileChange(e){
    e.preventDefault(e);
    this.setState({mobileNumber: e.target.value});
  }

  handleHomeChange(e){
    e.preventDefault(e);
    this.setState({homeNumber: e.target.value});
  }

  handleAddressChange(e){
    e.preventDefault(e);
    this.setState({address: e.target.value});
  }

  handleLogout(e){
    e.preventDefault(e);
    this.props.handleLogout(e);
  }

  render() {
    return (
      <div>
        <div className="header">
                <span className="user">
                    <span id="user" onClick={this.getUserProfile}>
                        <img className="logo" src={process.env.PUBLIC_URL + '/'+this.props.icon}/><br/>
                        <span>{this.props.Name}</span>
                    </span>
                </span>
                <span className="title">
                    <h1>SocialCafe</h1>
                </span>
                <span className="logout">
                    <span><button type="button" onClick={this.handleLogout}>Log Out</button></span>
                </span>
    		</div>
        <FriendList 
          friends={this.props.friends}
        />
    		

        <div className="main">

        {this.props.personalDetails === 0? (
                         <Posts 
                         posts={this.props.posts}
                         friends={this.props.friends}
                         triggerStar={this.props.triggerStar}
                         addComment={this.props.addComment}
                         id={this.props.id}
                         deleteComment={this.props.deleteComment}
                         removeComments={this.props.removeComments}
                         newComments={this.props.newComments}
                       />) : (
                        <div className="UserDetail">
                          <img src={process.env.PUBLIC_URL + '/'+this.props.icon}/>
                          <p>Mobile Number: <input onChange={this.handleMobileChange} value={this.state.mobileNumber} /></p>
                          <p>Home Number: <input onChange={this.handleHomeChange} value={this.state.homeNumber} /></p>
                          <p>Address: <input onChange={this.handleAddressChange} value={this.state.address} /></p>
                          <button onClick={this.saveUserProfile}>Save</button><br/><br/>
                        </div>
                        )}
       
    		</div>

      </div>
    );
  }
} 


class Posts extends React.Component {
  constructor(props) {
    super(props);
    this.updateComments = this.updateComments.bind(this);
    this.state = {
      intervalStop:""
    };
  }

  updateComments(){
    $.ajax({
      url: 'http://localhost:3001/socialservice/loadcommentupdates', 
      method: 'get',
      crossDomain: true,
      xhrFields: {withCredentials: true}
    })
    .then(function(success){
      if(success.deletedComments !== [] || success.newComments!== []){
        console.log(this.props);
        this.props.newComments(success.newComments);
        this.props.removeComments(success.deletedComments);
      }
    }.bind(this),function(error){
      console.log('Error: ' + error);
    });
  }

  componentDidMount(){
    var start = setInterval(this.updateComments, 7000);
    this.setState({ intervalStop: start })
    
  }

  componentWillUnmount(){
    clearInterval(this.state.intervalStop);
  }
  
  render(){
    let postSections = [];
    this.props.posts.map((post) => {
      postSections.push(
        <span>
          <PostSection
            postDetail={post}
            friends={this.props.friends}
            triggerStar={this.props.triggerStar}
            addComment={this.props.addComment}
            id={this.props.id}
            deleteComment={this.props.deleteComment}
          /><br/><br/>
         </span>
        );
    });

    return(
      <span>
        {postSections}
      </span>
    );
  }
}


class PostSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: ""
    };
    this.triggerStar = this.triggerStar.bind(this); 
    this.addComment = this.addComment.bind(this);
  }



  addComment(e){
    e.preventDefault(e);
    if (e.keyCode === 13) {
      var comment = e.target.value;
      var id = e.target.id;

      $.ajax({
        url: 'http://localhost:3001/socialservice/postcomment/'+id, 
        method: 'post',
        data: {comment: comment},
        crossDomain: true,
        xhrFields: {withCredentials: true}
      })
      .then(function(success){
        if (success === ""){
          console.log("comment inserted");
          this.props.addComment();
          this.setState({
            text:""
          });
        } else {
          console.log("Comment insertion failed!");
        }
      }.bind(this),function(error){
        console.log('Error: ' + error);
      });
    }
  }

  handleChange(e){
    e.preventDefault(e);
    this.setState({text: e.target.value});
  }

  triggerStar(e){
    e.preventDefault(e);
    var id = e.currentTarget.id;
    $.ajax({
      url: 'http://localhost:3001/socialservice/updatestar/' + e.currentTarget.id, 
      method: 'get',
      crossDomain: true,
      xhrFields: {withCredentials: true}
    })
		.then(function(success){
			if (success === ""){
				this.props.triggerStar(id);
			}
		}.bind(this),function(error){
			console.log('Error: ' + error);
		});
  }

  render(){
    let starStatus = "";
    this.props.friends.map((friend) => {
      if(friend.starredOrNot === "Y" && friend.name === this.props.postDetail.poster){
        starStatus = "fa fa-star";
      }
      else if(friend.starredOrNot === "N" && friend.name === this.props.postDetail.poster){
        starStatus = "fa fa-star-o";
      }
    });
    return(
      <section>
        <img className="postImg" src={process.env.PUBLIC_URL + '/'+this.props.postDetail.posterAvatar}/>
          <a>{this.props.postDetail.poster} &nbsp;&nbsp; <span id={this.props.postDetail.userId.toString()} onClick={this.triggerStar}><i className={starStatus.toString()} aria-hidden="true" id="friendStar"></i></span><br/>{this.props.postDetail.time}<br/>{this.props.postDetail.location}<br/>{this.props.postDetail.post}</a>
          
          <ul className="clearfix comments" id={this.props.postDetail.id}>
            <CommentList
              comments={this.props.postDetail.comment}
              deleteComment={this.props.deleteComment}
              postId={this.props.postDetail.id}
              id={this.props.id}
            />
          </ul>
          <input className="commentBox" placeholder="Place your comments here" type="textarea" value={this.state.text} id={this.props.postDetail.id.toString()} onChange={this.handleChange.bind(this)} onKeyUp={this.addComment}/>
      </section>
    );
  }
}

class CommentList extends React.Component {
  constructor(props) {
    super(props);
  }

  render(){
    let rows = [];
    this.props.comments.map((comment) => {
        rows.push(
          <CommentRow
            commentDetail={comment}
            deleteComment={this.props.deleteComment}
            postId={this.props.postId}
            id={this.props.id}
          />
        );
    });

    return(
      <span>
        {rows}
      </span>
            
    );
  }
}

class CommentRow extends React.Component {
  constructor(props) {
    super(props);
    this.deleteComment = this.deleteComment.bind(this);
  }

  deleteComment(e){
    e.preventDefault(e);
    if(this.props.commentDetail.userId === this.props.id){
      console.log(this.props.commentDetail.userId);
      console.log(this.props.id);
      var confirmation = window.confirm('Are you sure you want to delete this contact?');
      if(confirmation === true){
        
        var commentId = e.currentTarget.id;
        console.log(commentId);
        $.ajax({
          url: 'http://localhost:3001/socialservice/deletecomment/' + commentId, 
          method: 'delete',
          crossDomain: true
        })
        .then(function(success){
          if (success === ""){
            this.props.deleteComment(commentId, this.props.postId);
          }
        }.bind(this),function(error){
          console.log('Error: ' + error);
        });
      }
      }
  }

  render(){

    return(
          <li onDoubleClick={this.deleteComment} id={this.props.commentDetail.id}><div><small>{this.props.commentDetail.poster} said on {this.props.commentDetail.postTime}: </small></div>{this.props.commentDetail.comment}</li>
    );
  }
}


class FriendList extends React.Component {
  constructor(props) {
    super(props);
  }

  render(){
    let rows = [];
    this.props.friends.map((friend) => {
      if(friend.starredOrNot === "Y"){
        rows.push(
          <FriendRow
            friendDetail={friend}
          />
        );
      }
    });

    return(
      <div className="friendlist">
    			<span className="title">Friends:</span>
          {rows}
    			
    	</div>
    );
  }
}

class FriendRow extends React.Component {
  constructor(props) {
    super(props);
  }
  
 render() {
    const friend = this.props.friendDetail;

    return (
      <p className="friend" rel={friend.friendId}>{friend.name} &nbsp;&nbsp; <i className="fa fa-star" aria-hidden="true" id="friendStar"></i></p>
    );
  }
}

export default SocialCafe;
