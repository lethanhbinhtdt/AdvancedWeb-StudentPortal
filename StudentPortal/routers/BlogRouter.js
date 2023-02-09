const express = require('express')
const Router = express.Router()
const rateLimit = require('express-rate-limit')

// giới hạn đăng bài của sinh viên
const blogLimiter = rateLimit({
    windowMs: 10 * 1000, // 10s
    max: 2, // start blocking after 2 requests
    message: "Không thể gửi quá 2 bài trong 10s"
})


// auth
const checkLogin = require('../auth/checkLogin')

// model
const BlogModel = require('../models/BlogModel')

// API Student đăng bài viết
Router.post('/add', checkLogin, blogLimiter, (req, res) => {
    const user = req.session.user
    let {blogText, blogVideo, userID} = req.body
    console.log(blogText, blogVideo, userID)
    if (!blogText && !blogVideo) {
        return res.json({code: '101', message: 'Vui lòng nhập thông tin bài viết'})
    }
    // get date dd/mm/yyyy
    let date = new Date()
    let a = date.toISOString().slice(0,10)  // 2021-05-11
    let b = a.split('-')
    let create_on = b[2]+'/'+b[1]+'/'+b[0]  // 11/05/2021
    // end get date
    let newBlog = new BlogModel({
        content: blogText,
        image: '',
        video: blogVideo,
        create_on: create_on,
        userName: user.name,
        userAvatar: user.avatar,
        userID: user._id,
    })
    newBlog.save()
    .then(blog => {
        console.log(blog)
        return res.json({code: '0', message: 'OK', blog: blog, user})
    })
    .catch(e => {
        return res.json({code: '1', message: e.message})
    })
    
    
})

// API Student xóa bài viết
Router.post('/delete/:id', checkLogin, (req, res) => {
    let user = req.session.user
    let blogID = req.params.id
    let {userID} = req.body
    console.log(blogID)
    if (user.role != 'admin' && user._id != userID){
        return res.json({code : '1', message: 'Thao tác không hợp lệ'})
    }
    BlogModel.findByIdAndRemove(blogID)
    .then(e => {
        console.log(e)
        return res.json({code : '0', message: 'Xóa thành công'})
    })
    .catch(e => {
        return res.json({code : '2', message: 'Xóa không thành công'})
    })

})
// comment vào blog theo id
Router.post('/comment/:id', checkLogin, (req, res) => {
    let user = req.session.user
    let blogID = req.params.id
    let {comment} = req.body

    // get date dd/mm/yyyy
    let date = new Date()
    let a = date.toISOString().slice(0,10)  // 2021-05-11
    let b = a.split('-')
    let create_on = b[2]+'/'+b[1]+'/'+b[0]  // 11/05/2021
    // end get date
    let newComment = {
        comment: comment,
        userName: user.name,   // người bình luận
        userAvatar: user.avatar,
        userID: user._id,
        create_on: create_on
    }
    BlogModel.findByIdAndUpdate( blogID, {$push: {comments : newComment}},
        function(err, result) {
          if (err) {
            return res.json({code : '1', message: 'Thêm không thành công'})
          } else {
            return res.json({code : '0', message: 'Thêm thành công', data: newComment})
          }
        }
    );

})

// xóa comment
Router.post('/comment/delete/:id', checkLogin, (req, res) => {
    let user = req.session.user
    let commentID = req.params.id
    let {userID} = req.body

    if (user.role != 'admin' && user._id != userID){
        return res.json({code : '1', message: 'Thao tác không hợp lệ'})
    }
    // BlogModel.find()
    // .then(blogs => {
    //     let a = blogs.find(it => it.comments._id == commentID)
    //     console.log(blogs.comments, a)
    //     return res.json({code : '0', message: 'Xóa thành công'})
    // })
    // .catch(e => {
    //     return res.json({code : '2', message: 'Xóa không thành công'})
    // })

})

// like blog theo id
Router.post('/like/:id', checkLogin, (req, res) => {
    let user = req.session.user
    let blogID = req.params.id

    BlogModel.findById(blogID)
    .then(blog => {
        let a = blog.like
        a = a + 1
        BlogModel.findByIdAndUpdate(blogID, { like: a })
        .then(() => {
            return res.json({code : '0', message: 'Thích thành công', data: a})
        })
    })
    .catch(e => {
        return res.json({code : '1', message: 'Thích không thành công'})
    })

})

module.exports = Router