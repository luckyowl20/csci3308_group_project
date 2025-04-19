function populateBlogs(blogs_string) {
    const blogs = JSON.parse(blogs_string);
    const blogContainer = document.getElementById('blog-container');
    blogContainer.innerHTML = ''; // Clear previous content
    // convert into blog.style.... lines: style="display: flex; justify-content: center; align-items: center; gap: 20px" 
    blogContainer.style.display = 'flex';
    blogContainer.style.flexDirection = 'row';
    blogContainer.style.justifyContent = 'center';
    blogContainer.style.alignItems = 'center';
    blogContainer.style.gap = '20px';
    blogContainer.style.width = '95%';
    blogContainer.style.flexWrap = 'wrap';
    blogContainer.style.margin = '0 auto'; // Center the container
    //creating each blog;

    blogs.forEach(blog => {

        // Create the main blog card container
        const blogCard = document.createElement('div');
        blogCard.className = 'card mb-4';
        blogCard.style.width = '400px'; // Set the width of the card

        // Title & Author section
        const authorSection = document.createElement('p');
        authorSection.style.display = 'flex'; //centering text
        authorSection.style.flexDirection = 'column';
        authorSection.style.justifyContent = 'center';
        authorSection.style.alignItems = 'center';
        authorSection.className = 'card-header';
        authorSection.textContent = `${blog.title}: ${blog.author}`;
        blogCard.appendChild(authorSection);
        

        // Swipable pictures container
        
        const carouselId = `carousel-${blog.id}`;
        const carousel = document.createElement('div');
        carousel.id = carouselId;
        carousel.className = 'carousel slide';
        carousel.setAttribute('data-interval', 'false');



        const carouselInner = document.createElement('div');
        carouselInner.className = 'carousel-inner';
        carouselInner.style.height = '600px'
        //populating blogs with posts

        blog.blogposts.forEach((post, index) => {

            const carouselItem = document.createElement('div'); // Create a new carousel item
            carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`; //only first item is active by default;

            const contentWrapper = document.createElement('div'); // Create a wrapper for the content, this centers the content in the carousel
            contentWrapper.style.display = 'flex';
            contentWrapper.style.height = '600px';
            contentWrapper.style.flexDirection = 'column';
            contentWrapper.style.justifyContent = 'center';
            contentWrapper.style.alignItems = 'center';

            const header = document.createElement('p'); //post title and author
            header.textContent = `${post.title}: ${post.author}`;

            contentWrapper.appendChild(header);

            if(post.url) { //if the post has a url, include the image
                const img = document.createElement('img');
                img.src = post.url;
                img.alt = `Blog image ${post.id}`;

                img.setAttribute('width', '300px');
                img.setAttribute('height', '300px');

                contentWrapper.appendChild(img);
            }

            const body = document.createElement('p'); //post body
            body.textContent = post.body;

            contentWrapper.append(body);

            const date = document.createElement('p'); //post creation date
            let time = ""; //extracting year, month and day from the created_at string
            for(var i = 0; i < 10; i++) {
                time += post.created_at[i];
            }
            date.textContent = time;

            contentWrapper.appendChild(date);
            
            carouselItem.appendChild(contentWrapper);
            carouselInner.appendChild(carouselItem);
        });

        //add buttons to carousel

        //previous button

        const prevButton = document.createElement('a');
        prevButton.className = 'carousel-control-prev';
        prevButton.href = `#${carouselId}`;
        prevButton.setAttribute('role', 'button');
        prevButton.setAttribute('data-bs-slide', 'prev');

        const prevIcon = document.createElement('span');
        prevIcon.className = 'carousel-control-prev-icon';
        prevIcon.style.filter = 'invert(100%)'; // Ensures the arrow is black
        prevButton.appendChild(prevIcon);

        const prevText = document.createElement('span');
        prevText.className = 'sr-only';
        prevText.textContent = 'Previous';
        // prevButton.appendChild(prevText);

        //next button

        const nextButton = document.createElement('a');
        nextButton.className = 'carousel-control-next';
        nextButton.href = `#${carouselId}`;
        nextButton.setAttribute('role', 'button');
        nextButton.setAttribute('data-bs-slide', 'next');

        const nextIcon = document.createElement('span');
        nextIcon.className = 'carousel-control-next-icon';
        nextIcon.style.filter = 'invert(100%)'; // Ensures the arrow is black
        nextButton.appendChild(nextIcon);

        const nextText = document.createElement('span');
        nextText.className = 'sr-only';
        nextText.textContent = 'Next';
        // nextButton.appendChild(nextText);

        // Change button text to black

        prevButton.style.color = 'black';
        nextButton.style.color = 'black';

        //finish the carousel

        carousel.appendChild(carouselInner);
        carousel.appendChild(prevButton);
        carousel.appendChild(nextButton);
        blogCard.appendChild(carousel);

        // Footer section

        const footerSection = document.createElement('div');
        footerSection.className = 'card-footer'; // centering text
        footerSection.style.display = 'flex';
        footerSection.style.flexDirection = 'column';
        footerSection.style.justifyContent = 'center';
        footerSection.style.alignItems = 'center';

        // Footer body

        const body = document.createElement('p');
        body.textContent = blog.body;
        footerSection.appendChild(body);

        // const date = document.createElement('p');
        // let time = ""; //extracting year, month and day from the created_at string
        // for(var i = 0; i < 10; i++) {
        //     time += blog.created_at[i];
        // }
        // date.textContent = time;
        // footerSection.appendChild(date);

        blogCard.appendChild(footerSection);

        // Append the blog card to the container
        blogContainer.appendChild(blogCard);
    });

}

document.addEventListener('DOMContentLoaded', function () {
    const createBlogForm = document.getElementById('createBlogForm');
    createBlogForm.addEventListener('submit', function (event) {
        const checkboxes = document.querySelectorAll('input[name="postSelection"]:checked');
        if (checkboxes.length < 2) {
            event.preventDefault();
            alert('Please select at least two posts.');
        }
        else {
            const selectedPosts = Array.from(checkboxes).map(checkbox => checkbox.value);
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'selectedPosts';
            hiddenInput.value = JSON.stringify(selectedPosts);
            createBlogForm.appendChild(hiddenInput);
            createBlogForm.submit();
        }
    });
});