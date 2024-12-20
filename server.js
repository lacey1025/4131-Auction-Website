const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const port = 4131;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/css", express.static("resources/css/"));
app.use("/images", express.static("resources/images/"));
app.use("/js", express.static("resources/js/"));
app.use(cookieParser()); // for parsing the cookie request-header into req.cookies
app.set("views", "templates");
app.set("view engine", "pug");
const fs = require('fs');
const {
    addListing,
    deleteListing,
    getListing,
    getGallery,
    placeBid,
    getBids,
    getHighestBid
  } = require('./data');



let rateLimitStore = [];
const RATE_LIMIT = 3; // requests per second
const RATE_LIMIT_WINDOW = 10; // seconds

const checkRateLimit = () => {
  const now = new Date();
  rateLimitStore = rateLimitStore.filter(time =>
    (now - time) <= RATE_LIMIT_WINDOW * 1000
  );

  if (rateLimitStore.length >= RATE_LIMIT) {
    const oldestRequest = rateLimitStore[0];
    const retryAfter = RATE_LIMIT_WINDOW - ((now - oldestRequest) / 1000);
    return { passed: false, retryAfter };
  }

  rateLimitStore.push(now);
  return { passed: true };
};

app.get('/', (req, res) => {
    res.render("mainpage.pug");
})

app.get('/main', (req, res) => {
    res.render("mainpage.pug");
})

app.get('/gallery', async (req, res) => {
    const category = req.query.category || "";
    const query = req.query.query || "";
    try {
      const listings = await getGallery(query, category);
      res.render("gallery.pug", { listings, category, query });
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).send("Internal server error");
    }
  });

app.get('/create', (req, res) => {
    res.render("create.pug");
})

app.post('/create', async (req, res) => {
    const { title, image, description, category, end_date, category_other } = req.body;
    if (!title || !image || !description || !category || !end_date) {
        return res.status(400).render('create-fail.pug');
    }
    let listingCategory = category;
    if (category == "other") {
        if (!category_other) {
            return res.status(400).render('create-fail.pug');
        }
        listingCategory = category_other;
    }

    const parsedEndDate = new Date(end_date);
    if (isNaN(parsedEndDate.getTime()) || parsedEndDate < new Date()) {
        return res.status(400).render('create-fail.pug');
    }

    const newListing = {
        title,
        image,
        description,
        category: listingCategory,
        end_date: parsedEndDate
    };
    try {
        await addListing(newListing);
        res.status(201).render('create-success.pug');
    } catch (error) {
        console.error("error adding listing");
        res.status(500).render('create-fail.pug');
    }
})



app.get('/create-success', (req, res) => {
    res.render("create-success.pug");
})

app.get('/create-fail', (req, res) => {
    res.render("create-fail.pug");
})

app.get('/listing/:id', async (req, res) => {
    const listingId = req.params.id;
    try {
        const listing = await getListing(listingId);
        if (listing) {
            res.render('listing.pug', { listing });
        } else {
            res.status(404).render('404.pug');
        }
    } catch (error) {
        console.error("Error fetching listing");
        res.status(500).send("internal server error");
    }
    
})

app.post('/api/place_bid', async (req, res) => {
    const rateLimitResult = checkRateLimit();
    if (!rateLimitResult.passed) {
        res.set('Retry-After', rateLimitResult.retryAfter);
        return res.status(429).send('Too Many Requests');
    }
    const { listing_id, bidder_name, bid_amount, comment } = req.body;
    if (!listing_id || !bidder_name || !bid_amount) {
        return res.status(400).json({status: "fail"});
    }

    const bidAmountFloat = parseFloat(bid_amount);
    if (isNaN(bidAmountFloat)) {
        return res.status(409).json({status: "fail"});
    }

    try {
        const highestBid = await getHighestBid(listing_id);
        if (bidAmountFloat <= highestBid) {
            return res.status(409).json({ status: "fail"});
        }
        const cookies = req.cookies;
        const bidderName = cookies.bidder_name || bidder_name;

        const newBid = {
            auction_id: listing_id,
            bidder_name: bidderName,
            bid_amount: bidAmountFloat,
            comment: comment
        };
        await placeBid(newBid);
        res.cookie('bidder_name', bidderName, {path: '/'});
        const bids = await getBids(listing_id);
        res.status(201).json(bids);
    } catch (error) {
        console.error("Error placing bid");
        res.status(500).json({ status: "error"});
    }
})

app.delete('/api/delete_listing', async (req, res) => {
    const rateLimitResult = checkRateLimit();
    if (!rateLimitResult.passed) {
        res.set('Retry-After', rateLimitResult.retryAfter);
        return res.status(429).send('Too Many Requests');
    }
    
    const { listing_id } = req.body;

    if (!listing_id) {
        return res.status(400).json({status: "fail"});
    }
    try {
        const success = await deleteListing(listing_id);
        if (success) {
            res.status(204).send();
        } else {
            res.status(404).json({ status: "fail"});
        }
    } catch (error) {
        console.error("error deleting listing");
        res.status(500).json({status: "error"});
    }
})

app.use((req, res, next) => {
    res.status(404).render("404.pug")
})

app.listen (port, () => {
    console.log(`Example app listen on port ${port}`);
})