// this package behaves just like the mysql one, but uses async await instead of callbacks.
const mysql = require(`mysql-await`); // npm install mysql-await

// first -- I want a connection pool: https://www.npmjs.com/package/mysql#pooling-connections
// this is used a bit differently, but I think it's just better -- especially if server is doing heavy work.
var connPool = mysql.createPool({
  connectionLimit: 5, // it's a shared resource, let's not go nuts.
  host: "127.0.0.1",// this will work
  user: "C4131F24U103",
  database: "C4131F24U103",
  password: "10659", // we really shouldn't be saving this here long-term -- and I probably shouldn't be sharing it with you...
});

// later you can use connPool.awaitQuery(query, data) -- it will return a promise for the query results.


async function addListing(data) {
  const { title, image, description, category, end_date } = data;
  const query = `INSERT INTO auction (title, image, description, category, end_date)
    VALUES (?, ?, ?, ?, ?)`;
  const values = [title, image, description, category, end_date];
  try {
    const result = await connPool.awaitQuery(query, values);
    return result.insertId;
  } catch (error) {
    console.error("error adding listing");
    throw error;
  }
}

async function deleteListing(id) {
  const deleteBidsQuery = `DELETE FROM bid WHERE auction_id = ?`;
  const deleteAuctionQuery = `DELETE FROM auction WHERE id = ?`;

  try {
    await connPool.awaitQuery(deleteBidsQuery, [id]);
    const result = await connPool.awaitQuery(deleteAuctionQuery, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Error deleting listing:", error);
    throw error;
  }
}

async function getListing(id) {
  try {
    const listingQuery = `SELECT * FROM auction WHERE id = ?`;
    const bidsQuery = `SELECT * FROM bid WHERE auction_id = ? ORDER BY bid_amount DESC`;

    const [listing] = await connPool.awaitQuery(listingQuery, [id]);
    const bids = await connPool.awaitQuery(bidsQuery, [id]);

    if (!listing) {
      return null;
    }
    listing.bids = bids;
    return listing;
  } catch (error) {
    console.error("error getting listing");
    throw error;
  }
}

async function getGallery(query, category) {
  try {
    let galleryQuery = `
      SELECT auction.*, COUNT(bid.id) AS num_bids, MAX(bid.bid_amount) AS top_bid_amount
      FROM auction
      LEFT JOIN bid ON auction.id = bid.auction_id
      WHERE 1=1
    `;
    const values = [];

    if (category && category !== 'all') {
      galleryQuery += ` AND auction.category = ?`;
      values.push(category);
    }

    if (query) {
      galleryQuery += ` AND (auction.title LIKE ? OR auction.description LIKE ?)`;
      values.push(`%${query}%`, `%${query}%`);
    }

    galleryQuery += ` GROUP BY auction.id`;

    const listings = await connPool.awaitQuery(galleryQuery, values);
    return listings;
  } catch (error) {
    console.error("Error getting gallery:", error);
    throw error;
  }
}

async function placeBid(data) {
  const { auction_id, bidder_name, bid_amount, comment } = data;
  const query = `INSERT INTO bid (auction_id, bidder_name, bid_amount, comment)
    VALUES (?, ?, ?, ?)`;

  const values = [auction_id, bidder_name, bid_amount, comment];

  try {
    const result = await connPool.awaitQuery(query, values);
    return result.insertId;
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
}

// Function to get bids for a listing
async function getBids(listing_id) {
  const query = `SELECT * FROM bid WHERE auction_id = ? ORDER BY bid_amount DESC`;

  try {
    const bids = await connPool.awaitQuery(query, [listing_id]);
    return bids;
  } catch (error) {
    console.error("Error getting bids:", error);
    throw error;
  }
}

// Function to get the highest bid for a listing
async function getHighestBid(listing_id) {
  const query = `SELECT * FROM bid WHERE auction_id = ? ORDER BY bid_amount DESC LIMIT 1`;

  try {
    const [highestBid] = await connPool.awaitQuery(query, [listing_id]);
    if (highestBid) {
      return highestBid.bid_amount;
    } else {
      return null;
    }
  } catch (error) {
    console.error("error getting highest bid");
    throw error;
  }
}

module.exports = {
    addListing,
    deleteListing,
    getListing,
    getGallery,
    placeBid,
    getBids,
    getHighestBid
};

// ssh seman035@csel-kh1250-05.cselabs.umn.edu -L 8062:cse-mysql-classes-01.cse.umn.edu:3306
// mysql -h 127.0.0.1 --port 8062 -u C4131F24U103 C4131F24U103 -p