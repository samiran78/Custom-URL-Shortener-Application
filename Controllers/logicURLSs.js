const { nanoid } = require("nanoid");
const URL = require('../models/url');
const handleGenerateShortUrl = async (req, res) => {
    const { url } = req.body;
    //user have to pass original url.
    if (!url) {
        return res.status(400).json({ message: "Please provide original url." });
    }
    const shortID = nanoid(8);
    await URL.create({
        shortId: shortID, redirectUrl: url, totalClicksHistory: [],
        createdBywhom:   req.user.id
        // ✅ Pass an empty array to avoid ReferenceError
    });console.log("Generated Short ID:", shortID);
    return res.render("home",{
        Id: shortID
    })
    // return res.json({ Id: shortID });

}
//REDIRECTION+CLICKED COUNT WORKING-->
const handleRedirect = async (req, res) => {
    try {
        // const { shortID } = req.params;
        const shortID = req.params.shortID;  // ✅ Extracting it correctly

        // // Find the URL in the database
        // const urlData = await URL.findOne({ shortId: shortID });
        const urlData = await URL.findOneAndUpdate(
            { shortId: shortID }, 
            { 
                $inc: { clicksCount: 1 }, 
                $push: { totalClicksHistory: { timestamp: new Date() } }
            }, 
            { new: true } // Returns updated document
        );

        if (!urlData) {
            return res.status(404).json({ message: "Short URL not found!" });
        }
        console.log(`Before update: Clicks = ${urlData.clicksCount}`);
        // Increment click count and store history
        urlData.clicksCount += 1;
        urlData.totalClicksHistory.push({ timestamp: new Date() });
        await urlData.save();
        console.log(`After update: Clicks = ${urlData.clicksCount}`);

        console.log(`Redirecting to: ${urlData.redirectUrl}`);
        
        // Redirect the user
        return res.redirect(urlData.redirectUrl);
    } catch (error) {
        console.error("Error handling redirect:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};





const analyticsCLICKed = async (req, res) => {
    const shortID = req.params.shortID;  // ✅ Extracting it correctly
    const result = await URL.findOne({ shortId: shortID });
    if (!result) {
        return res.status(404).json({ message: "Short URL not found!" });
    }
    return res.json({

        TotalClicks: result.totalClicksHistory.length, // ✅ Accessing the clicked times
        analytics: result.totalClicksHistory // ✅ Accessing the correct property

    }
    );

}


module.exports = {handleGenerateShortUrl, analyticsCLICKed ,handleRedirect};