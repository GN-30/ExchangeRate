const express = require('express');

const router =
    express.Router();


const {
    calculateItinerary
} = require(
    '../controllers/itineraryController'
);


router.post(
    '/calculate',
    calculateItinerary
);


module.exports = router;