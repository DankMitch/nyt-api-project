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
        
        // Event listeners
        this.sectionSelect.addEventListener('change', () => this.loadStories());
        this.refreshButton.addEventListener('click', () => this.loadStories());
        
        // Add click events to category items
        this.categoryList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const category = e.target.textContent.toLowerCase();
                this.sectionSelect.value = category;
                this.loadStories();
            }
        });
        
        // Initial load
        this.loadStories();
    }   
    loadStories() {
        const url = `${this.baseUrl}/${this.sectionSelect.value}.json?api-key=${this.apiKey}`;
        
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                this.displayStories(data.results);
            })
            .catch(error => {
                console.error('Error loading stories:', error);
                this.storiesContainer.innerHTML = '<p>Error loading stories. Please try again later.</p>';
            });
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
    }    createStoryCard(story, image) {
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
                    <p class="card-text">${story.abstract}</p>
                    <p class="byline">${story.byline}</p>
                    <span class="date">${this.formatDate(story.published_date)}</span>
                </div>
            </div>
        `;
    }    
    displayStories(stories) {
        this.storiesContainer.innerHTML = '';
          // First move through all the main content
        // We'll add the categories row just before the mini cards

        // First row - Large story and controls
        const firstRow = document.createElement('div');
        firstRow.className = 'row mb-4';
        
        const firstStory = stories[0];
        const firstImage = firstStory.multimedia?.find(media => 
            media.type === 'image' && 
            (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
        );
        const firstStoryElement = document.createElement('div');
        firstStoryElement.className = 'col-md-8 mb-4';
        firstStoryElement.innerHTML = this.createStoryCard(firstStory, firstImage);
        firstRow.appendChild(firstStoryElement);

        // Controls
        const controlsElement = document.createElement('div');
        controlsElement.className = 'col-md-4 mb-4';
        controlsElement.innerHTML = `
            <div class="controls-card">
                <h2 class="controls-title">News Sections</h2>
                <div class="controls-content">
                    <div class="select-wrapper"></div>
                </div>
            </div>
        `;
        controlsElement.querySelector('.select-wrapper').appendChild(this.sectionSelect);
        controlsElement.querySelector('.controls-content').appendChild(this.refreshButton);
        firstRow.appendChild(controlsElement);
        this.storiesContainer.appendChild(firstRow);

        // Second and third rows - Three small cards each
        for (let row = 0; row < 2; row++) {
            const smallRow = document.createElement('div');
            smallRow.className = 'row mb-4';
            
            for (let i = 0; i < 3; i++) {
                const storyIndex = 1 + (row * 3) + i;
                if (storyIndex < stories.length) {
                    const story = stories[storyIndex];
                    const image = story.multimedia?.find(media => 
                        media.type === 'image' && 
                        (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
                    );                    const storyElement = document.createElement('div');
                    storyElement.className = 'col-md-4 mb-4';
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
            col.innerHTML = `<h2 class="section-header" data-section="${category.toLowerCase()}">${category}</h2>`;
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
                        storyElement.innerHTML = this.createStoryCard(story, image);
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
            lastFeaturedRow.appendChild(storyElement);            // Add a regular card (col-md-4) next to the double-wide card
            const smallStory = stories[12];
            if (smallStory) {
                const smallImage = smallStory.multimedia?.find(media => 
                    media.type === 'image' &&
                    (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
                );                const smallElement = document.createElement('div');
                smallElement.className = 'col-md-4 mb-4';
                smallElement.innerHTML = this.createStoryCard(smallStory, smallImage);
                lastFeaturedRow.appendChild(smallElement);
            }
        }
        this.storiesContainer.appendChild(lastFeaturedRow);

        // Remaining stories in regular grid
        const remainingRow = document.createElement('div');
        remainingRow.className = 'row';
        for (let i = 13; i < stories.length; i++) {
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
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NYTNewsApp();
});
