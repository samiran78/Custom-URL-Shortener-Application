// class AuthService {
//     constructor() {
//         this.sessionidtoUserMap = new Map(); // Storing session IDs mapped to users
//     }
//   setUser(id,user){
//         this.sessionidtoUserMap.set(id,user);
//     }
//     getUser(id){
//         return this.sessionidtoUserMap.get(id);
//     }
    
// }
// module.exports ={
//     AuthService
    

// }
// Global Map to store session data

//stateful-->
// const sessionidtoUserMap = new Map();
// stateless-->
// const jwt = require('jsonwebtoken');
// const TOKEN_TICKET = "TOKEN_TICKET78";

// function setUser(id, user) {
//     // sessionidtoUserMap.set(id, user);---->stateful way
//     // ---->stateless way
//     const payload ={
//         id,
//         ...user,
//     }
//     return jwt.sign(payload,TOKEN_TICKET)
// }
const jwt = require('jsonwebtoken');
const TOKEN_TICKET = "TOKEN_TICKET78";  // ---->stateless way

function setUser(id, user) {
    const payload = { 
        id: id,
        email:user.email,
        role:user.roleType
    };

    // ✅ Sign JWT with expiration time
    const token = jwt.sign(payload, TOKEN_TICKET, { expiresIn: "9h" });

    console.log("Generated JWT:", token); // 🔍 Debugging

    return token;
}


// function getUser(TicketToken) {
//     // return sessionidtoUserMap.get(id); ---->STATEFULl
//     // --->stateless  
//     if(!TicketToken){
//         return null;
//     }
//     return jwt.verify(TicketToken,TOKEN_TICKET);
// }


function getUser(TicketToken) {
    if (!TicketToken) {
        console.log("No Token Received!");
        return null;
    }

    console.log("Received Token:", TicketToken);
    
    try {
        const decoded = jwt.verify(TicketToken, TOKEN_TICKET);
        console.log("Decoded Token:", decoded);
        return decoded;
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return null;
    }
}

module.exports = { setUser, getUser }; // ✅ Export functions


