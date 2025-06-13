// NYT API functionality
class NYTNewsApp {
    constructor() {
        // TODO: Replace with your actual API key from NYT
        this.apiKey = 'p9y6PaYBA6c1M6hg2UCdpsPtCJaUxdge';
        this.baseUrl = 'https://api.nytimes.com/svc/topstories/v2';
        this.currentSection = 'home';
        
        // DOM elements
        this.sectionSelect = document.getElementById('sectionSelect');
        this.refreshButton = document.getElementById('refreshButton');
        this.storiesContainer = document.getElementById('storiesContainer');
        
        // Event listeners
        this.sectionSelect.addEventListener('change', () => this.loadStories());
        this.refreshButton.addEventListener('click', () => this.loadStories());
        
        // Initial load
        this.loadStories();
    }    loadStories() {
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
    }

    displayStories(stories) {
        this.storiesContainer.innerHTML = '';
        
        stories.forEach(story => {
            // Find the first image from multimedia that meets our criteria
            const image = story.multimedia?.find(media => 
                media.type === 'image' && 
                (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
            );            const storyElement = document.createElement('article');
            storyElement.className = 'story-card';
            
            // Add border elements for animation
            const borderLeft = document.createElement('div');
            borderLeft.className = 'border-left';
            const borderRight = document.createElement('div');
            borderRight.className = 'border-right';
            storyElement.appendChild(borderLeft);
            storyElement.appendChild(borderRight);
            
            storyElement.innerHTML = `
                ${image ? `<img src="${image.url}" alt="${image.caption}" class="story-image">` : ''}
                <div class="story-content">
                    <div class="story-section">${story.section}</div>
                    <h2 class="story-title">
                        <a href="${story.url}" target="_blank" rel="noopener noreferrer">${story.title}</a>
                    </h2>
                    <p class="story-abstract">${story.abstract}</p>
                    <p class="story-byline">${story.byline}</p>
                    <p class="story-date">${this.formatDate(story.published_date)}</p>
                </div>
            `;
            
            this.storiesContainer.appendChild(storyElement);
        });
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NYTNewsApp();
});
