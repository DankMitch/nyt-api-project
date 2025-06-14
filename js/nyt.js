// NYT API functionality
class NYTNewsApp {
    constructor() {
        this.apiKey = 'p9y6PaYBA6c1M6hg2UCdpsPtCJaUxdge';
        this.baseUrl = 'https://api.nytimes.com/svc/topstories/v2';
        
        // DOM elements
        this.sectionSelect = document.getElementById('sectionSelect');
        this.refreshButton = document.getElementById('refreshButton');
        this.storiesContainer = document.getElementById('storiesContainer');
        this.categoryList = document.querySelector('.category-list');
        this.mobileRefreshButton = document.getElementById('mobileRefreshButton');
        this.footerMobileRefreshButton = document.getElementById('footerMobileRefreshButton');

        // Add screen size change listener
        const xlBreakpoint = window.matchMedia('(min-width: 1200px)');
        xlBreakpoint.addListener((e) => {
            // Reload stories when crossing the XL breakpoint
            this.loadStories();
        });

        // Event listeners
        this.sectionSelect.addEventListener('change', () => this.loadStories());
        this.refreshButton.addEventListener('click', () => this.loadStories());
        
        // Add refresh functionality to mobile refresh buttons with mobile
        if (this.mobileRefreshButton) {
            this.mobileRefreshButton.addEventListener('click', () => this.loadStories());
        }
        if (this.footerMobileRefreshButton) {
            this.footerMobileRefreshButton.addEventListener('click', () => this.loadStories());
        }

        // Function to handle category clicks
        const handleCategoryClick = (e) => {
            if (e.target.tagName === 'LI') {
                let category = e.target.textContent.toLowerCase();
                // Handle special cases
                if (category === 'real estate') {
                    category = 'realestate';
                }
                this.sectionSelect.value = category;
                this.loadStories();
                window.scrollTo(0, 0);  // Scroll to top when clicking footer nav
            }
        };
        
        // Add click events to both header and footer nav
        this.categoryList.addEventListener('click', handleCategoryClick);
        document.querySelector('.footer-nav').addEventListener('click', handleCategoryClick);
        
        // Add click handler to footer nav
        document.querySelector('.footer-nav').addEventListener('click', handleCategoryClick);
        
        // Initial load
        this.loadStories();
    }     async fetchStories(category) {
        const url = `${this.baseUrl}/${category}.json?api-key=${this.apiKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.results;
        } catch (error) {
            console.error(`Error fetching ${category} stories:`, error);
            throw error;
        }
    }    async loadStories() {
        try {
            const stories = await this.fetchStories(this.sectionSelect.value);
            if (!stories || stories.length === 0) {
                throw new Error('No stories available');
            }
            this.displayStories(stories);
        } catch (error) {
            this.storiesContainer.innerHTML = `
                <div class="alert alert-info" role="alert">
                    <h4>Story Update</h4>
                    <p>We're currently refreshing our news feed for this section.</p>
                    <p>In the meantime, try exploring other sections or check back in a few moments.</p>
                </div>`;
        }
    }

    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }    createStoryCard(story, image, isCategoryCard = false) {
        const defaultImage = {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/77/The_New_York_Times_logo.png',
            caption: 'The New York Times'
        };
        const imageToUse = image || defaultImage;
        
        return `
            <div class="card">
                <img src="${imageToUse.url}" alt="${imageToUse.caption}" class="card-img-top" onerror="this.src='${defaultImage.url}'">
                <div class="card-body">
                    <div class="small text-uppercase mb-2" style="color: var(--primary-color);">${story.section}</div>
                    <h2 class="card-title">
                        <a href="${story.url}" target="_blank" rel="noopener noreferrer">${story.title}</a>
                    </h2>
                    ${!isCategoryCard ? `<p class="card-text">${story.abstract}</p>` : ''}
                    <p class="byline">${story.byline}</p>
                    <span class="date">${this.formatDate(story.published_date)}</span>
                </div>
            </div>
        `;
    }    
    displayStories(stories) {
        this.storiesContainer.innerHTML = '';
        
        // First row - Large story and small card
        const firstRow = document.createElement('div');
        firstRow.className = 'row mb-4';
        
        // Main story (double-wide)
        const firstStory = stories[0];
        const firstImage = firstStory.multimedia?.find(media => 
            media.type === 'image' && 
            (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
        );        const firstStoryElement = document.createElement('div');
        firstStoryElement.className = 'col-12 col-lg-8 first-story mb-4';
        firstStoryElement.innerHTML = this.createStoryCard(firstStory, firstImage);
        firstRow.appendChild(firstStoryElement);

        // Small card next to main story (only visible on large screens via CSS)
        const secondStory = stories[1];
        const secondImage = secondStory.multimedia?.find(media => 
            media.type === 'image' && 
            (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
        );        const secondStoryElement = document.createElement('div');
        secondStoryElement.className = 'col-12 col-sm-6 col-lg-4 second-story mb-4';
        secondStoryElement.innerHTML = this.createStoryCard(secondStory, secondImage);
        firstRow.appendChild(secondStoryElement);

        // Controls (only visible on XL screens)
        const controlsElement = document.createElement('div');
        controlsElement.className = 'col-md-4 mb-4';
        controlsElement.innerHTML = `
            <div class="sections-card">
                <h2 class="sections-title">News Sections</h2>
                <div class="sections-content">
                    <div class="select-wrapper"></div>
                </div>
            </div>
        `;
        controlsElement.querySelector('.select-wrapper').appendChild(this.sectionSelect);
        controlsElement.querySelector('.sections-content').appendChild(this.refreshButton);
        firstRow.appendChild(controlsElement);
        this.storiesContainer.appendChild(firstRow);

        // Second and third rows - Three small cards each, starting from the third story
        for (let row = 0; row < 2; row++) {
            const smallRow = document.createElement('div');
            smallRow.className = 'row mb-4';            for (let i = 0; i < 3; i++) {
                // On XL screens (where second-story is hidden), start from story 2
                // On other screens (where second-story is shown), start from story 3
                const startIndex = window.matchMedia('(min-width: 1200px)').matches ? 1 : 2;
                const storyIndex = startIndex + (row * 3) + i;
                if (storyIndex < stories.length) {
                    const story = stories[storyIndex];
                    const image = story.multimedia?.find(media => 
                        media.type === 'image' && 
                        (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
                    );                    const storyElement = document.createElement('div');
                    storyElement.className = 'col-12 col-sm-6 col-lg-4 mb-4';
                    storyElement.innerHTML = this.createStoryCard(story, image);
                    smallRow.appendChild(storyElement);
                }
            }
            this.storiesContainer.appendChild(smallRow);
        }        // Categories row
        const categories = ['Politics', 'World', 'Opinion', 'Business'];
        const categoriesRow = document.createElement('div');        categoriesRow.className = 'row mb-2';
        categories.forEach(category => {
            const col = document.createElement('div');
            col.className = 'col-md-3';
            col.innerHTML = `<h2 class="section-header" data-section="${category.toLowerCase()}">${category} ></h2>`;
            col.querySelector('.section-header').addEventListener('click', () => {
                this.sectionSelect.value = category.toLowerCase();
                this.loadStories();
                window.scrollTo(0, 0);
            });
            categoriesRow.appendChild(col);
        });
        this.storiesContainer.appendChild(categoriesRow);

        // Mini cards row - one for each category
        const miniRow = document.createElement('div');
        miniRow.className = 'row mb-4';
        
        // Load and display stories for each category
        Promise.all(categories.map(category => {
            const url = `${this.baseUrl}/${category.toLowerCase()}.json?api-key=${this.apiKey}`;
            return fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.results && data.results.length > 0) {
                        const story = data.results[0];  // Get the top story from each category
                        const image = story.multimedia?.find(media => 
                            media.type === 'image' && 
                            (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
                        );                        const storyElement = document.createElement('div');
                        storyElement.className = 'col-md-3 mb-4';
                        storyElement.innerHTML = this.createStoryCard(story, image, true);
                        miniRow.appendChild(storyElement);
                    } else {
                        // If no story found for category, create empty column
                        const emptyElement = document.createElement('div');
                        emptyElement.className = 'col-md-3 mb-4';
                        miniRow.appendChild(emptyElement);
                    }
                })
                .catch(() => {
                    // Handle error by adding empty column
                    const emptyElement = document.createElement('div');
                    emptyElement.className = 'col-md-3 mb-4';
                    miniRow.appendChild(emptyElement);
                });
        }));
        this.storiesContainer.appendChild(miniRow);

        // Last featured row
        const lastFeaturedRow = document.createElement('div');
        lastFeaturedRow.className = 'row mb-4';
        const lastFeaturedStory = stories[11];
        if (lastFeaturedStory) {
            const image = lastFeaturedStory.multimedia?.find(media => 
                media.type === 'image' && 
                (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
            );
            const storyElement = document.createElement('div');
            storyElement.className = 'col-md-8 mb-4';
            storyElement.innerHTML = this.createStoryCard(lastFeaturedStory, image);
            lastFeaturedRow.appendChild(storyElement);

            const smallStory = stories[12];
            if (smallStory) {
                const smallImage = smallStory.multimedia?.find(media => 
                    media.type === 'image' &&
                    (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
                );
                const smallElement = document.createElement('div');
                smallElement.className = 'col-md-4 mb-4';
                smallElement.innerHTML = this.createStoryCard(smallStory, smallImage);
                lastFeaturedRow.appendChild(smallElement);
            }
        }
        this.storiesContainer.appendChild(lastFeaturedRow);

        // Add two buffer rows before second categories
        const bufferRow1 = document.createElement('div');
        bufferRow1.className = 'row mb-4';
        for (let i = 13; i < 16; i++) {
            if (i < stories.length) {
                const story = stories[i];
                const image = story.multimedia?.find(media => 
                    media.type === 'image' && 
                    (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
                );
                const storyElement = document.createElement('div');
                storyElement.className = 'col-md-4 mb-4';
                storyElement.innerHTML = this.createStoryCard(story, image);
                bufferRow1.appendChild(storyElement);
            }
        }
        this.storiesContainer.appendChild(bufferRow1);

        const bufferRow2 = document.createElement('div');
        bufferRow2.className = 'row mb-4';
        for (let i = 16; i < 19; i++) {
            if (i < stories.length) {
                const story = stories[i];
                const image = story.multimedia?.find(media => 
                    media.type === 'image' && 
                    (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
                );
                const storyElement = document.createElement('div');
                storyElement.className = 'col-md-4 mb-4';
                storyElement.innerHTML = this.createStoryCard(story, image);
                bufferRow2.appendChild(storyElement);
            }
        }
        this.storiesContainer.appendChild(bufferRow2);        // Second categories row with logging
        console.log('Loading second categories...');
        const categories2 = ['Arts', 'Science', 'Technology', 'Health'];
        const categoriesRow2 = document.createElement('div');
        categoriesRow2.className = 'row mb-2';
        categories2.forEach(category => {
            const col = document.createElement('div');
            col.className = 'col-md-3';
            col.innerHTML = `<h2 class="section-header" data-section="${category.toLowerCase()}">${category} ></h2>`;
            col.querySelector('.section-header').addEventListener('click', () => {
                this.sectionSelect.value = category.toLowerCase();
                this.loadStories();
                window.scrollTo(0, 0);
            });
            categoriesRow2.appendChild(col);
        });
        this.storiesContainer.appendChild(categoriesRow2);        // Mini cards row for second categories with improved error handling
        const miniRow2 = document.createElement('div');
        miniRow2.className = 'row mb-4';
        
        // Create array to hold stories in correct order
        const categoryStories = Array(categories2.length).fill(null);
        
        Promise.all(categories2.map((category, index) => {
            const categorySlug = category.toLowerCase();
            console.log(`Fetching ${categorySlug} stories...`);
            const url = `${this.baseUrl}/${categorySlug}.json?api-key=${this.apiKey}`;
            return fetch(url)
                .then(response => {
                    if (!response.ok) {
                        console.error(`Error fetching ${categorySlug}: ${response.status}`);
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.results && data.results.length > 0) {
                        const story = data.results[0];
                        const image = story.multimedia?.find(media => 
                            media.type === 'image' && 
                            (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
                        );
                        // Store story in the correct position
                        categoryStories[index] = { story, image };
                    }
                })
                .catch(error => {
                    console.error(`Error with ${categorySlug}:`, error);
                });
        })).then(() => {
            // Add stories to miniRow2 in correct order
            categoryStories.forEach((item, index) => {
                const storyElement = document.createElement('div');
                storyElement.className = 'col-md-3 mb-4';
                if (item) {
                    storyElement.innerHTML = this.createStoryCard(item.story, item.image, true);
                }
                miniRow2.appendChild(storyElement);
            });
        });
        this.storiesContainer.appendChild(miniRow2);

        // Remaining stories in regular grid
        const remainingRow = document.createElement('div');
        remainingRow.className = 'row';
        for (let i = 19; i < stories.length; i++) {
            const story = stories[i];
            const image = story.multimedia?.find(media => 
                media.type === 'image' && 
                (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
            );
            const storyElement = document.createElement('div');
            storyElement.className = 'col-md-4 mb-4';
            storyElement.innerHTML = this.createStoryCard(story, image);
            remainingRow.appendChild(storyElement);
        }
        this.storiesContainer.appendChild(remainingRow);
    }

    async createCategorySection(categories, options = {}) {
        const { addBufferRows = false } = options;
        
        // Create category headers
        const categoriesRow = document.createElement('div');
        categoriesRow.className = 'row mb-2';
        categories.forEach(category => {
            const col = document.createElement('div');
            col.className = 'col-md-3';
            col.innerHTML = `<h2 class="section-header" data-section="${category.toLowerCase()}">${category} ></h2>`;
            col.querySelector('.section-header').addEventListener('click', () => {
                this.sectionSelect.value = category.toLowerCase();
                this.loadStories();
                window.scrollTo(0, 0);
            });
            categoriesRow.appendChild(col);
        });

        // Create mini cards row
        const miniRow = document.createElement('div');
        miniRow.className = 'row mb-4';
        
        // Load category stories in parallel but maintain order
        const categoryStories = await Promise.all(categories.map(async (category) => {
            try {
                const stories = await this.fetchStories(category.toLowerCase());
                if (stories?.length > 0) {
                    return {
                        story: stories[0],
                        image: this.findArticleImage(stories[0])
                    };
                }
            } catch (error) {
                console.error(`Error loading ${category} stories:`, error);
            }
            return null;
        }));

        // Create cards in correct order
        categoryStories.forEach(item => {
            const storyElement = document.createElement('div');
            storyElement.className = 'col-md-3 mb-4';
            if (item) {
                storyElement.innerHTML = this.createStoryCard(item.story, item.image, true);
            }
            miniRow.appendChild(storyElement);
        });

        return [categoriesRow, miniRow];
    }

    findArticleImage(story) {
        return story.multimedia?.find(media => 
            media.type === 'image' && 
            (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
        ) || {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/77/The_New_York_Times_logo.png',
            caption: 'The New York Times'
        };
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NYTNewsApp();
});
