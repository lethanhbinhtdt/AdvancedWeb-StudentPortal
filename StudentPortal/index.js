const express = require("express")
const mongoose = require("mongoose")
const cookieParser = require('cookie-parser')
const session = require('express-session')
const expressLayouts = require('express-ejs-layouts')
require("dotenv").config()
const socketio = require('socket.io')

const app = express()

// router
const AccountRouter = require("./routers/AccountRouter")
const NotificationRouter = require("./routers/NotificationRouter")
const DepartmentRouter = require("./routers/DeparmentRouter")
const BlogRouter = require("./routers/BlogRouter")

// ejs, layout
app.set("view engine", "ejs")
app.use(expressLayouts)
app.set('layout', 'layouts/MainLayout');

app.use(express.static(__dirname + "/public"))
app.use(express.urlencoded({extended: false}))    // body parser
app.use(express.json())

app.use(cookieParser());
app.use(session({
    secret: '123456',
    resave: true,
    rolling: true,
    saveUninitialized: true,
    cookie: { maxAge: 15 * 60 * 1000 } // 15 minutes
}))

// router
app.use("/user", AccountRouter)
app.use("/noti", NotificationRouter)
app.use("/department", DepartmentRouter)
app.use("/blog", BlogRouter)

app.get('/', (req, res) => {
    res.redirect('/user/login')
})
app.get('*', (req, res) => {
    const error = '404 - KHÔNG TÌM THẤY TRANG'
    res.render('error', {layout: 'layouts/LoginLayout', error})
})

const PORT = process.env.PORT || 8080

mongoose.connect("mongodb://localhost/StudentPortal", {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        })
        .then(() => {
            //  socket io thông báo cho người dùng khi khoa đăng thông báo mới
            const httpServer = app.listen(PORT, () => console.log("http://localhost:" + PORT))
            // const io = socketio(httpServer)

            
            // io.on('connection', client => {
            //     console.log(`Client ${client.id} đã kết nối`)
            //     let chatID = ''
                
            //     client.on('disconnect', () => {
            //         console.log(`${client.id} đã thoát`)
            //     })
                
            //     // gửi thêm tin user mới cho tất cả user đang online
            //     client.broadcast.emit('new-notification')

            // })
        })
        .catch((e) => console.log("Khong the ket noi toi db server: " + e.message));


