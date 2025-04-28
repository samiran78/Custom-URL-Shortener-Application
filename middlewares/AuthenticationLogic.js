// const {getUser} = require('../service/auth');
// async function restrictedtologinUserOnly(req,res,next){
//     const uuid = req.cookies.sessionID;
//     if(!uuid){
//         return res.redirect('/login');
//     }
//     const userr = getUser(uuid);
//     if(!userr){
//         return res.redirect('/login');
//     }
//     req.userr=userr;
//     next(); // Allow request to proceed
// }
// async function checkAuth(req,res,next){
//     const uuid = req.cookies.sessionID;
//     const userr = getUser(uuid);
//     //not hard-checking if theres no user null , can use loggin--> not strictly providing loggedin.
//     req.userr=userr;
//     next(); // Allow request to proceed


// }
// module.exports = {restrictedtologinUserOnly, checkAuth};
const { getUser } = require("../service/auth");
function checkforAuthentication(req, res, next) {

    // const token = req.cookies?.tokenn;
    console.log("Received Cookies:", req.cookies); // 🔍 Debugging
    const tokenCokie = req.cookies?.token; // Get the token from cookies
//     console.log("Cookie Token:", token); // 🔍 Debugging
//     console.log("Raw Cookie Header:", req.headers.cookie);
// console.log("Received Cookies:", req.cookies);
// console.log("Raw Cookie Header:", req.headers.cookie);


    // req.user = null;

    if (!tokenCokie) {
        // // console.log("No Token Found!");
        // return  res.render("login");
        return next();
    }
    const token = tokenCokie;
    const userr = getUser(token);
    
    // if (!userr) {
    //     console.log("Invalid Token, Authentication Failed!");
    //     return res.status(401).send("Unauthorized");
    // }

    req.user = userr;
    console.log("User Authenticated:", req.user);
   return next();
}
// SEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE

// --->
// function checkforAuthentication(req, res, next) {
//     const authorizationHeaderValue = req.headers["authorization"];
//     // const tokencookie = req.cookies?.tokenn;
//     req.user=null;
//     if (!authorizationHeaderValue || !authorizationHeaderValue.startsWith("Bearer ")) {
//         //no token without bearer..
//         return next();
//     }
//     if(!tokencookie) return next();
//     const tokenn = authorizationHeaderValue.split("Bearer ")[1]; // get token from header
//     // const tokenget = tokencookie;
//     // if there is no token-> null
//      const userr = getUser(tokenn);
//     // const userr = getUser(tokenget);
//     req.user = userr;
//     return next(); // Allow request to proceed
// }

// async function restrictedtologinUserOnly(req, res, next) {
//     const uuid = req.cookies.sessionID;
//     if (!uuid) {
//         return res.redirect("/login");
//     }

//     const userr = await getUser(uuid); // ✅ Await the async function
//     if (!userr) {
//         return res.redirect("/login");
//     }

//     req.user = userr; // ✅ Assign correctly
//     next(); // Proceed to next middleware or route
// }

// async function checkAuth(req, res, next) {
//     // const uuid = req.cookies.sessionID;
//     // const userr = await getUser(uuid); // ✅ Await the async function
//     const uuid = req.headers["authorization"];
//     const userr = uuid.split("Bearer ")[1]; //split bearer token from the header
//     req.user = userr; // ✅ Assign correctly
//     next(); // Proceed to next middleware or route
// }
function restrictedTologin(roles = []) {
    return function (req, res, next) {
        if (!req.user) {
            return res.redirect('/login');
        }
        if (!roles.includes(req.user.role)) { 
            // return res.end("unauthorized"); 
        return res.status(403).send({ message: "Forbidden" });
        }
        return next();
    }
}
module.exports = {
    checkforAuthentication, restrictedTologin
}
// module.exports = { restrictedtologinUserOnly, checkAuth, checkforAuthentication };
