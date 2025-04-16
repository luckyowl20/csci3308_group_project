function populateBlogs(blogs_string) {
    const blogs = JSON.parse(blogs_string);
    const blogContainer = document.getElementById('blog-container');
    blogContainer.innerHTML = ''; // Clear previous content
    
    blogs.forEach(blog => {

        // Create the main blog card container
        const blogCard = document.createElement('div');
        blogCard.className = 'card mb-4';

        // Author section
        const authorSection = document.createElement('div');
        authorSection.className = 'card-header';
        authorSection.textContent = `${blog.title}`;
        blogCard.appendChild(authorSection);
        

        // Swipable pictures container
        


        const carouselId = `carousel-${blog.id}`;
        const carousel = document.createElement('div');
        carousel.id = carouselId;
        carousel.className = 'carousel slide';
        carousel.setAttribute('data-bs-ride', 'carousel');

        const carouselInner = document.createElement('div');
        carouselInner.className = 'carousel-inner';
        carouselInner.style.height = '750px'



    

        blog.blogposts.forEach((post, index) => {
            const carouselItem = document.createElement('div');
            carouselItem.className = `carousel-item ${index === 0 ? 'active' : ''}`;

            const contentWrapper = document.createElement('div');
            contentWrapper.style.display = 'flex';
            contentWrapper.style.flexDirection = 'column';
            contentWrapper.style.justifyContent = 'center';
            contentWrapper.style.alignItems = 'center';

            const header = document.createElement('p');
            header.style.fontWeight = 'bold';
            header.textContent = `${post.title}, Author: ${post.author}`;

            contentWrapper.appendChild(header);

            if(post.url) {
                const img = document.createElement('img');
                img.src = post.url;
                img.alt = `Blog image ${post.id}`;

                img.style.width = '600px';
                img.style.height = '600px';

                contentWrapper.appendChild(img);
            }

            const body = document.createElement('p');
            body.textContent = post.body;

            contentWrapper.append(body);
            
            carouselItem.appendChild(contentWrapper);
            carouselInner.appendChild(carouselItem);
        });

        //add buttons to carousel
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
        prevButton.appendChild(prevText);

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
        nextButton.appendChild(nextText);

        // Change button arrows to black
        
        

        prevButton.style.color = 'black';
        prevButton.style.fontWeight = 'bold';

        nextButton.style.color = 'black';
        nextButton.style.fontWeight = 'bold';

        carousel.appendChild(carouselInner);
        carousel.appendChild(prevButton);
        carousel.appendChild(nextButton);
        blogCard.appendChild(carousel);

        // Description section
        const descriptionSection = document.createElement('div');
        descriptionSection.className = 'card-body';
        descriptionSection.textContent = blog.description;
        blogCard.appendChild(descriptionSection);

        // Footer section
        const footerSection = document.createElement('div');
        footerSection.className = 'card-footer';
        footerSection.textContent = `${blog.body}`;
        blogCard.appendChild(footerSection);

        // Append the blog card to the container
        blogContainer.appendChild(blogCard);
    });

}