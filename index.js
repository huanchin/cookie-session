const express = require("express");
const session = require("express-session");

const app = express();

app.use(express.json());

//1. config session middleware (config for session)
app.use(
  session({
    // store: new RedisStore({ client: redisClient }),
    secret: "mySecret", // 用來簽名存放在cookie的sessionID
    // name: "user", // 存放在cookie的key，如果不寫的話預設是connect.sid
    //這個如果設定是true，會把「還沒修改過的」session就存進session store。
    // 以登入的例子來說，就是使用者還沒登入，我還沒把使用者資訊寫入session，就先存放了session在session store。
    // 設定為false可以避免存放太多空的session進入session store。
    // 另外，如果設為false，session在還沒被修改前也不會被存入cookie。
    saveUninitialized: false,
    // 如果設定為true，則在一個request中，無論session有沒有被修改過，都會強制保存原本的session在session store。
    // 會有這個設定是因為每個session store會有不一樣的配置，有些會定期去清理session，
    // 如果不想要session被清理掉的話，就要把這個設定為true。
    resave: false,
    cookie: {
      secure: false, // only send the cookie if the incoming request is https request, set to true in production
      httpOnly: true, // prevent client side js from reading the cookie
      maxAge: 1000 * 60 * 30, // session max age in milliseconds
    },
  })
);

// 2. create login endpoint
app.post("/login", (req, res) => {
  // 使用者登入
  const { email, password } = req.body;
  const user = {
    firstName: "Tony",
    email: "tony@stark.com",
    password: "iamironman",
  };

  // 驗證資料庫內的帳號密碼
  if (user.email === email && user.password === password) {
    // 通過後在伺服器端把使用者資訊存入session store，並生成session ID作為索引
    req.session.user = user.firstName; // 把使用者名字存在session store。
    // 當存入後，因為session被修改過了，
    // express-session就會幫我們把帶有session ID 的session內容存入store，
    // 並把session ID簽名後存放在使用者瀏覽器cookie。
    return res.json("you are now logged in");
  }
  return res.json("password or email is incorrect, please try again!");
});

// 3. 驗證登入狀態 (protect route)
app.use((req, res, next) => {
  console.log(req.session);
  if (!req.session.user) {
    const err = new Error("you shall not pass");
    err.statusCode = 401;
    next(err);
  }
  next();
});

// 4. protected routes
app.get("/profile", (req, res) => {
  res.json(req.session);
});

// 5. logout
app.get("/logout", (req, res) => {
  // 登出可以使用express-session給的destroy方法來清理session store
  req.session.destroy(() => {
    console.log("session destroyed");
  });
  res.clearCookie("connect.sid");
  res.json("You are logged out! Re-enter email and password to log in again!");
});

app.use((err, req, res, next) => {
  res.json({
    status: err.statusCode,
    message: err.message,
  });
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
