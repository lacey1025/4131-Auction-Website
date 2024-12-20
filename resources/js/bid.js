
const windowPath = window.location.pathname;
const path_listing_number = windowPath.substring(windowPath.lastIndexOf('/') + 1);
document.getElementById("listing_num").value = path_listing_number;
const button = document.getElementById("place_bid_button");
let bidderName = "";

function fillNameValue() {
    const nameInput = document.getElementById("name");
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${"bidder_name"}=`);
    if (parts.length == 2) {
        bidderName = parts.pop().split(';').shift();
    }
    nameInput.value = bidderName;
}

button.addEventListener("click", () => {
    const bid_form = document.getElementById("add_bid");
    document.getElementById("amount").style.borderColor = "black";
    if (bid_form.style.display == "none" || bid_form.style.display == "") {
        bid_form.style.display = "flex";
        button.textContent = "cancel bid"
        button.style.backgroundColor = "#c62b2b";
    } else {
        bid_form.style.display = "none";
        button.textContent = "place bid"
        button.style.backgroundColor = "#438f7f";
    }
});

const submitButton = document.getElementById("submit_bid_button");
submitButton.addEventListener("click", async () => {
    const name = document.getElementById("name").value;
    const amount = document.getElementById("amount").value;
    const comment = document.getElementById("comment").value;
    const listing_num = document.getElementById("listing_num").value;

    const bidData = {
        listing_id: listing_num,
        bidder_name: name,
        bid_amount: amount,
        comment: comment
    };

    try {
        const request = new Request("/api/place_bid", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bidData),
            credentials: "include"
        });

        const response = await fetch(request);

        if (response.status == 201) {
            const bids = await response.json();
            const allBids = document.getElementById("bids");
            allBids.innerHTML = ""

            bids.sort((a, b) => b.bid_amount - a.bid_amount);

            bids.forEach(bid => {
                const bidElement = document.createElement("div");
                bidElement.classList.add("bid");

                const amountElement = document.createElement("span");
                amountElement.classList.add("amount");
                amountElement.textContent = `$${parseFloat(bid.bid_amount).toFixed(2)}`;

                const nameElement = document.createElement("span");
                nameElement.classList.add("bidder");
                nameElement.textContent = bid.bidder_name;
                
                bidElement.appendChild(amountElement);
                bidElement.appendChild(nameElement);

                if (bid.comment) {
                    const commentElement = document.createElement("p");
                    commentElement.textContent = bid.comment;
                    bidElement.appendChild(commentElement);
                }
                
                allBids.appendChild(bidElement);
            });

            if (response.status == 201) {
                document.getElementById("name").value = "";
                document.getElementById("amount").value = "";
                document.getElementById("comment").value = "";
                document.getElementById("add_bid").style.display = "none";
                button.textContent = "place bid";
                button.style.backgroundColor = "#438f7f";
            }
        } else if (response.status == 400 || response.status == 500) {
            alert("Error");
        } else if (response.status == 409) {
            document.getElementById("amount").style.borderColor = "red";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Server error");
    }
});

fillNameValue();
