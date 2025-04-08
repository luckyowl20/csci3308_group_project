document.getElementById('left-swipe').addEventListener('click', () => {
    swipe('left');
});

document.getElementById('right-swipe').addEventListener('click', () => {
    swipe('right');
});

function swipe(direction) {
    const card = document.getElementById('card');
    if (direction === 'left') {
        card.style.transform = 'translateX(-100%)';
    } else {
        card.style.transform = 'translateX(100%)';
    }
    setTimeout(() => {
        card.style.transform = 'translateX(0)';
        // Load new card data here
    }, 300);
}




const users = [
    { name: 'Alice', location: 'New York', photo: '/resources/img/alice.jpg' },
    { name: 'Bob', location: 'Los Angeles', photo: '/resources/img/bob.jpg' },
    { name: 'Charlie', location: 'Chicago', photo: '/resources/img/charlie.jpg' },
    { name: 'Dana', location: 'San Francisco', photo: '/resources/img/dana.jpg' },
    // Add more mock users
];

let currentIndex = 0;

function loadCard() {
    const card = document.getElementById('card');
    const user = users[currentIndex];
    card.querySelector('img').src = user.photo;
    card.querySelector('#user-name').textContent = user.name;
    card.querySelector('#user-location').textContent = user.location;
}

document.getElementById('left-swipe').addEventListener('click', () => {
    swipe('left');
});

document.getElementById('right-swipe').addEventListener('click', () => {
    swipe('right');
});

function swipe(direction) {
    const card = document.getElementById('card');
    if (direction === 'left') {
        card.style.transition = 'transform 0.3s ease';
        card.style.transform = 'translateX(-100%)';
    } else {
        card.style.transition = 'transform 0.3s ease';
        card.style.transform = 'translateX(100%)';
    }
    setTimeout(() => {
        card.style.transition = 'none';
        card.style.transform = 'translateX(0)';
        currentIndex = (currentIndex + 1) % users.length;
        loadCard();
    }, 300);
}

loadCard();