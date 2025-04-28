const express = require('express');
const { handleGenerateShortUrl, analyticsCLICKed,handleRedirect} = require('../Controllers/logicURLSs')
const router = express.Router();
// const check = "HII CONNECTED OKYY!!";
// router.get('/see',check);
router.get('/see', (req, res) => {
    res.send("HII CONNECTED OKYY!!");
});

router.post('/', handleGenerateShortUrl);
router.get("/:shortID", handleRedirect);
router.get('/analyticsCLICKed/:shortID', analyticsCLICKed);

module.exports = router;