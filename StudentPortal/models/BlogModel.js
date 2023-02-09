const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BlogModel = new Schema({
    content: String,
    image: String,
    video: String,
    like: {
        type: Number,
        default: 0
    },
    create_on: String,
    userName: String,       // người tạo bài viết
    userAvatar: String,
    userID: String,
    comments: [{
        comment: String,
        userName: String,   // người bình luận
        userAvatar: String,
        userID: String,
        create_on: String
    }]
})

module.exports = mongoose.model('Blog', BlogModel)