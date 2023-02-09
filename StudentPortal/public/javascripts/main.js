//----- login
// google oauth
function onSignIn(googleUser) {
  var id_token = googleUser.getAuthResponse().id_token;
  // send ID token to server
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/user/loginGG');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
    if (xhr.responseText == 'success'){
      signOut();
      // đăng nhập thành công
      location.assign('/noti');
    }
    if (xhr.responseText == 'invalid email'){
      signOut();
      let errorDiv = $(`
                        <div class="p-3 mb-2 bg-danger text-white rounded">Email không hợp lệ! Vui lòng đăng nhập bằng email sinh viên</div>
                      `);
      $('#login-error').empty()
      $('#login-error').append(errorDiv)
    }
  };
  xhr.send(JSON.stringify({token: id_token}));
}

// Google sign out
function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut();
}


//----- Register
// hiển thị phòng/khoa được chọn
function onChangeFaculty() {
  $('#register-selected-faculty').empty()

  let elements = document.querySelectorAll('#register-faculty-list input:checked');
  elements.forEach(e => {
    $('#register-selected-faculty').append(`<li>${e.value}</li>`)
  })
  
}

//----- home/ profile
// Hiển thị bình luận
function showComment(blogID) {
  
  // show comment
  let id = '#'+blogID
  $(id).show()

  // forcus input with querySelector
  let querySelector = id+' input'
  let input = document.querySelector(querySelector)
  input.setAttribute('tabindex','0')
  input.focus()
}

// bình luận vào bài viết
function commentTo(blogID) {
  let id = '#comment-'+blogID
  let comment = $(id).val()
  console.log(blogID, comment, id)
  $.post("/blog/comment/"+blogID, {comment: comment}, (data) => {
    let newComment = data.data
    console.log(data, newComment)
    let newDiv = `
    <div class="mt-3 d-flex d-row" id="comment-id-${ newComment._id } ">
    <img class="mr-2 rounded-circle mt-2" src="${ newComment.userAvatar } " alt="Avatar user" width="35px" height="35px">
    <div class="flex-column p-2 border rounded">
        <div class="d-flex justify-content-between">
            <div class="d-flex flex-column">
                <a href="/user/profile/${ newComment.userID }" class="text-dark"><b class="text-sm pt-1">${ newComment.userName }</b></a>
                <p class="text-secondary fs-smaller">${ newComment.create_on }</p>
            </div>
           
            <div class="dropdown">
                <button type="button" class="btn bi bi-three-dots rounded-pill" data-toggle="dropdown"></button>
                <div class="dropdown-menu">
                    <div class="dropdown-item" onclick="deleteComment(this)" data-commentID="${ newComment._id }" data-userID="${ newComment.userID }">Xóa</div>
                </div>
            </div>
        </div>
        <p class="text-justify">${ newComment.comment } </p>
    </div>
</div>  
    `

    $('#all-comment-'+blogID).append(newDiv)
    let a =$('#comment-number-'+blogID).text()
    let b = parseInt(a)
    $('#comment-number-'+blogID).text(b+1)
    $(id).val('')
  })

}

// thích bài viết
function likeBlog(blogID) {
  $.post("/blog/like/"+blogID, (data) => {
    console.log(data)
    if (data.code == '0'){
      $('#like-number-'+blogID).text(data.data)
    }
  })
}

// xóa comment

// xóa bài
function deleteComment(e) {
  let commentID = e.getAttribute('data-commentID')
  let userID = e.getAttribute('data-userID')

  $('#deleteCommentDialog .btn-confirm-delete').attr('data-commentID', commentID)
  $('#deleteCommentDialog .btn-confirm-delete').attr('data-userID', userID)
  
  $('#deleteCommentDialog').modal('show')
}


// xác nhận xóa
function confirmDeleteComment(e) {
  let commentID = e.getAttribute('data-commentID')
  let userID = e.getAttribute('data-userID')

  console.log(commentID, userID)
  $.post("/blog/comment/delete/"+commentID, {userID: userID}, (data) => {
    if (data.code == '0') {
      $('#'+commentID).remove()
    }
  })

  $('#deleteCommentDialog').modal('hide')

}

//-- đăng bài
// youtube video
function addVideo(e) {
  $('#addVideoDialog .video-error').hide()
  $('#addVideoDialog').modal('show')
}

function confirmAddVideo() {
  // let value = $('#add-video').val()
  // console.log(value)
  const videoId = getId($('#add-video').val());
  if (videoId) {
    
    const iframeMarkup = '<iframe width="498" height="280" src="//www.youtube.com/embed/' + videoId + '" frameborder="0" allowfullscreen></iframe>'
    let divVideo = `${iframeMarkup}`
    $('#add-video').val('')
    $('#addNewBlog').attr('data-blogVideo', videoId)
    $('.blog-upload').empty()
    $('.blog-upload').append(divVideo)
    $('#addVideoDialog').modal('hide')

  }else {
    $('#addVideoDialog .video-error').show()
  }
}

function getId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11)
    ? match[2]
    : null;
}
  

// image
function addImage(e) {
  $('#addImageDialog').modal('show')
}

function confirmAddImage(e) {
  $('.blog-video').val('')  // xóa video nếu có
  $('#addImageDialog').modal('hide')
}

//* đăng bài
function addBlog(e) {
  let blogText = $('#home-student-post').val()
  let blogVideo = e.getAttribute('data-blogVideo')
  let userID = e.getAttribute('data-userID')
  $.post("/blog/add", {userID: userID, blogText: blogText, blogVideo: blogVideo}, (data) => {

    $('.blog-upload').empty()
    $('#home-student-post').val('')
    $('#addNewBlog').attr('data-blogVideo', '')
    let blog = data.blog;
    let user = data.user;
    let image = '';
    let video = '';
    if (blog.image) {
      image = 
        `
        <div class="text-center">
          <img src="${blog.image}" alt="Blog image" class="img-fluid">
        </div>
        `;
    }
    if (blog.video) {
      image = 
        `
        <div class="text-center">
            <iframe width="498" height="280" src="//www.youtube.com/embed/${blog.video}" frameborder="0" allowfullscreen></iframe>
        </div>
        `;
    }
    let newBlog = `
    <div class="col-md-12 border rounded p-3 mt-3 bg-white" id="${blog._id}">
      <div class="d-flex justify-content-between">
          <div class="d-flex d-row">
              <img class="mr-2 rounded-circle mt-2" src="${blog.userAvatar}" alt="Avatar user" width="35px" height="35px">
              <div class="flex-column">
                  <a href="/user/profile/${blog.userID}" class="text-dark"><b>${blog.userName}</b></a>
                  <p class="text-secondary fs-smaller">${blog.create_on}</p>
              </div>
          </div>

          <div class="dropdown">
              <button type="button" class="btn bi bi-three-dots rounded-pill" data-toggle="dropdown"></button>
              <div class="dropdown-menu">
                  <div class="dropdown-item" data-blogID="${blog._id}" data-action="edit">Sửa</div>
                  <div class="dropdown-item" onclick="deleteBlog(this)" data-blogID="${blog._id}" data-userID="${blog.userID}">Xóa</div>
              </div>
          </div>
      </div>
      <div class="text-justify">
          <p>${blog.content}</p>
          ${image.toString()}
          ${video.toString()}
      </div>

      <div class="d-flex justify-content-between my-2">
        <i class="bi bi-hand-thumbs-up"><span id="like-number-${ blog._id }">${blog.like }</span> lượt thích</i>
        <i><span id="comment-number-${blog._id }">${blog.comments.length}</span> bình luận</i>
      </div>
      <hr class="mt-3 mb-1">
      <div class="d-flex justify-content-around my-2">
      <button type="button" class="btn btn-outline-secondary" onclick="likeBlog('${ blog._id }')"><i class="bi bi-hand-thumbs-up">&nbsp;Thích</i></button>
      <button type="button" class="btn btn-outline-secondary" onclick="showComment('blog-${ blog._id }')"><i class="bi bi-chat-left">&nbsp;Bình luận</i></button>
      </div>
      <div class="home-comment" id="blog-${ blog._id }">
        <hr class="mb-3 mt-1">
        <form action="javascript:void(0);" method="POST">
          <div class="d-flex d-row">
              <img class="mr-2 rounded-circle" src="${ user.avatar } " alt="Avatar user" width="35px" height="35px">
              <div class="input-group">
                  <input type="text" class="form-control" placeholder="Viết bình luận..." id="comment-${blog._id}">
                  <div class="input-group-append">
                      <button class="btn btn-outline-secondary" type="button" onclick="commentTo('${blog._id}')">Gửi</button>
                  </div>
              </div>
          </div>
        </form>

        <div class="d-flex flex-column-reverse" id="all-comment-${ blog._id }">
                
        </div>
      </div>

    </div>
    `;
    $('.newBlog').append(newBlog);
  })
}

// xóa bài
function deleteBlog(e) {
  let blogID = e.getAttribute('data-blogID')
  let userID = e.getAttribute('data-userID')

  $('#deleteBlogDialog .btn-confirm-delete').attr('data-blogID', blogID)
  $('#deleteBlogDialog .btn-confirm-delete').attr('data-userID', userID)
  
  $('#deleteBlogDialog').modal('show')
}


// xác nhận xóa
function confirmDeleteBlog(e) {
  let blogID = e.getAttribute('data-blogID')
  let userID = e.getAttribute('data-userID')

  console.log(blogID, userID)
  $.post("/blog/delete/"+blogID, {userID: userID}, (data) => {
    if (data.code == '0') {
      $('#'+blogID).remove()
    }
  })

  $('#deleteBlogDialog').modal('hide')

}
//--- notifications
// xóa thông báo
function deleteNoti(e) {
    let name = e.getAttribute('data-name')
    let id = e.getAttribute('data-id')
    $('#confirmDialog .noti-title').html(name)
    $('#confirmDialog .btn-confirm-delete').attr('data-id', id)
    
    $('#confirmDialog').modal('show')
}


// xác nhận xóa
function confirmDeleteNoti(e) {
  let id = e.getAttribute('data-id')
  $('#confirmDialog').modal('hide')

  $.post("/noti/delete/"+id)
  window.location.href = '/noti/notifications/'
}


//--- setting - chỉnh sửa thông tin sinh viên
// sửa thông tin
function editInfo(e) {
  let action = e.getAttribute('data-action')
  let attr = e.getAttribute('data-attr')
  $('#editDialog .btn-confirm-edit').attr('data-action', action)

  $('#editDialog #modal-title').html(attr)
  $('#editDialog').modal('show')
}
// xác nhận sửa
function confirmEdit(e) {
  let id = e.getAttribute('data-id')
  let action = e.getAttribute('data-action')
  let value = $('#edit-data').val()
  $('#editDialog').modal('hide')
  console.log(id, action, value)
  $.post("/user/setting", {id: id, action: action, value: value })
  window.location.href = '/user/setting'
}

// sửa avatar
function changeImage() {
  var fileName = $(".custom-file-input").val().split("\\").pop();
  $(".custom-file-input").siblings(".custom-file-label").addClass("selected").html(fileName);
}

function editAvatar(e) {
  $('#editAvatarDialog').modal('show')
}

function confirmEditAvatar(e) {
  $('#editAvatarDialog').modal('hide')
}


//--------- socket io, thông báo khi có thông báo mới
// let socket;
// $( window ).load(() => {
//   socket = io(); // connect to server
//   socket.on('new-notification', handleNewNoti);
//   $('#new-notification').fadeTo(10, 0);
// });


// function handleNewNoti(notiID){
//   $('#online-notification strong').html(username)
//   $('#online-notification').fadeTo(2000, 1) // show
//   setTimeout(() => {
//     $('#online-notification').fadeTo(2000, 0) // hide
//   }, 4000)
// }