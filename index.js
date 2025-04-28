const express = require("express");
const app = express();
const path = require("path");
const PORT = 8000;
const urlRoutes = require("./Routes/urlrouters");
const urlmodels = require("./models/url");
const staticRouteHomeEJS  = require('./Routes/staticroutes');
const UersRoute = require('./Routes/userRoutes');
//cookie-parser..
const cookieParser = require("cookie-parser");

//use middlewarevlogic
const {checkforAuthentication,restrictedTologin} = require('./middlewares/AuthenticationLogic');
app.use(cookieParser());  // ✅ Middleware to parse cookies
app.use(checkforAuthentication); // This must come after cookie-parser
// const {restrictedtologinUserOnly,checkAuth}  = require("./middlewares/AuthenticationLogic");

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set('views',path.resolve("./views"))
//BETTER UNDERSTANDING OF path.resolve..........

console.log(path.resolve("./views"));
console.log(path.resolve("views"));
console.log(path.resolve("/views"));

// ✅ Middleware to parse JSON requests
app.use(express.json());
//for handling form datas included with json datas..
app.use(express.urlencoded({ extended: true }));
const configDB = require("./configDB/configDB")
//to connect database--flexible
const mongoURI = "mongodb://localhost:27017/custom_url_shortener";

configDB(mongoURI).then(() =>
    console.log("mongodb connected")
)  // Pass the URL dynamically

//to use routes
app.use("/url", restrictedTologin(["NORMAL"]),urlRoutes);
//for static routes HOMEPAGE EJS...
app.use('/', staticRouteHomeEJS);
app.use('/user',  UersRoute);

// app.get('/:shortID', async (req, res) => {
//     // const { shortID } = req.params.shortID;
//     const shortID = req.params.shortID;  // ✅ Extracting it correctly

//     console.log("see the id-->", shortID);
//     const urll = await urlmodels.findOneAndUpdate({ shortId: shortID }, {
//         $inc: { clicksCount: 1 },
//         $push: {
//             // totalClicksHistory: { $each: [Date.now()] }
//             totalClicksHistory: { timestamp: new Date() }
//         },
        
//     },
   

//         // { new: true }  // ✅ Ensures updated document is returned
//         { new: true, upsert: false }  // ✅ Ensures updated data is returned
//     );
//     if (!urll) {
//         return res.status(404).json({ message: "Short URL not found!" });
//     }

//     // // Redirect the user to the original URL
//     // res.redirect(urlmodels.redirectUrl
//     // //now, update the click count
//     // const clickCount = urlmodels.clicksCount + 1;
//     // //push the lickCount in totalClicksHistory.......
//     // urlmodels.totalClicksHistory.push({
//     //     clicksCount: clickCount,
//     //     date: new Date()
//     // })
//     res.redirect(urll.redirectUrl);
//     console.log("Redirecting to:", urll.redirectUrl);


// });
app.get('/url/:shortID', async (req, res) => {
    const shortID = req.params.shortID;
    console.log("see the id-->", shortID);

    try {
        const urll = await urlmodels.findOneAndUpdate(
            { shortId: shortID },
            {
                $inc: { clicksCount: 1 },
                $push: { totalClicksHistory: { timestamp: new Date() } },
            },
            { new: true, upsert: false }
        );

        if (!urll) {
            return res.status(404).json({ message: "Short URL not found!" });
        }

        console.log("Redirecting to:", urll.redirectUrl);
        res.redirect(urll.redirectUrl);  // ✅ Use correct field name

    } catch (error) {
        console.error("Error fetching URL:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// app.get("/test", async(req, res) => {
//     const urllsdetails = await urlmodels.find({});
//     // res.json(urllsdetails);
//     return res.render("home");

// });
// app.get('/see/test', async (req, res) => {
//     try {
//         const urllsdetails = await urlmodels.find({});
//         return res.render("home", { urlss: urllsdetails });  // ✅ Now passing data to EJS
//     } catch (error) {
//         console.error("Error fetching URLs:", error);
//         return res.status(500).send("Internal Server Error");
//     }
// });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})