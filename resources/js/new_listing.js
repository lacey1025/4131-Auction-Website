const category = document.getElementById("category")
category.addEventListener("change", function() {
    if (category.value == "other") {
        document.getElementById("other_p").style.display = "block"; 
    } else {
        document.getElementById("other_p").style.display = "none";
    }
})



const submitButton = document.getElementById("submit-listing");
submitButton.addEventListener("click", async () => {
    const title = document.getElementById("title").value;
    const image = document.getElementById("image").value;
    const description = document.getElementById("description").value;
    const category = document.getElementById("category").value;
    const end_date = document.getElementById("end_date").value;
    const category_other = document.getElementById("category_other").value;
    

    const listingData = {
        title: title,
        image: image,
        description: description,
        category: category,
        end_date: end_date,
        category_other
    };

    try {
        const response = await fetch("/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(listingData)
        });

        if (response.status === 201) {
            window.location.href = "/create-success";
        } else {
            window.location.href = "/create-fail";
        }
    } catch (error) {
        window.location.href = "/create-fail";
    }
});

