// NYT API functionality
class NYTNewsApp {
    constructor() {
        this.apiKey = 'p9y6PaYBA6c1M6hg2UCdpsPtCJaUxdge';
        this.baseUrl = 'https://api.nytimes.com/svc/topstories/v2';        // DOM elements
        this.sectionSelect = document.getElementById('sectionSelect');
        this.mobileSectionSelect = document.getElementById('mobileSectionSelect');
        this.refreshButton = document.getElementById('refreshButton');
        this.storiesContainer = document.getElementById('storiesContainer');
        this.categoryList = document.querySelector('.category-list');
        this.mobileRefreshButton = document.getElementById('mobileRefreshButton');
        this.footerMobileRefreshButton = document.getElementById('footerMobileRefreshButton');
        
        // Footer controls
        this.footerSectionSelect = document.getElementById('footerSectionSelect');
        this.footerMobileSectionSelect = document.getElementById('footerMobileSectionSelect');
        this.footerRefreshButton = document.getElementById('footerRefreshButton');
        
        console.log('Initialized elements:', {
            sectionSelect: this.sectionSelect,
            mobileSectionSelect: this.mobileSectionSelect,
            refreshButton: this.refreshButton,
            mobileRefreshButton: this.mobileRefreshButton,
            footerRefreshButton: this.footerRefreshButton,
            footerMobileRefreshButton: this.footerMobileRefreshButton
        });
        
        // Initialize all select dropdowns with the same options
        this.initializeSelects();// Add screen size change listener
        const lgBreakpoint = window.matchMedia('(min-width: 992px)');
        lgBreakpoint.addListener((e) => {
            // Reload stories when crossing the LG breakpoint
            this.loadStories();
        });        // Setup event listeners for all refresh buttons and section selects
        const buttons = [
            this.refreshButton,
            this.mobileRefreshButton,
            this.footerRefreshButton,
            this.footerMobileRefreshButton
        ];
        
        buttons.forEach(button => {
            if (button) {
                button.addEventListener('click', () => {
                    console.log('Refresh clicked:', button.id);
                    this.loadStories();
                });
            }
        });        // Setup section select event listeners for all dropdowns
        [
            this.sectionSelect,
            this.mobileSectionSelect,
            this.footerSectionSelect,
            this.footerMobileSectionSelect
        ].forEach(select => {
            if (select) {
                select.addEventListener('change', (e) => {
                    console.log('Section changed:', select.id, 'to', e.target.value);
                    this.syncSelects(e.target.value);
                    this.loadStories();
                    // Scroll to top when using footer dropdowns
                    if (select.id === 'footerSectionSelect' || select.id === 'footerMobileSectionSelect') {
                        window.scrollTo(0, 0);
                    }
                });
            }
        });// Function to handle category clicks
        const handleCategoryClick = (e) => {
            if (e.target.tagName === 'LI') {
                let category = e.target.textContent.toLowerCase();
                // Handle special cases
                if (category === 'real estate') {
                    category = 'realestate';
                }
                this.syncSelects(category);
                this.loadStories();
                window.scrollTo(0, 0);  // Scroll to top when clicking footer nav
            }
        };
          
        // Add click event to all category lists
        document.querySelectorAll('.category-list').forEach(list => {
            list.addEventListener('click', handleCategoryClick);
        });
        
        // Initial load
        this.loadStories();
    }    
    fetchStories(category) {
    const url = `${this.baseUrl}/${category}.json?api-key=${this.apiKey}`;
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => data.results)
        .catch(error => {
            console.error(`Error fetching ${category} stories:`, error);
            throw error;
        });
}

loadStories() {
    this.fetchStories(this.sectionSelect.value)
        .then(stories => {
            if (!stories || stories.length === 0) {
                throw new Error('No stories available');
            }
            this.displayStories(stories);
        })
        .catch(error => {
            this.storiesContainer.innerHTML = `
                <div class="alert alert-info" role="alert">
                    <h4>Story Update</h4>
                    <p>We're currently refreshing our news feed for this section.</p>
                    <p>In the meantime, try exploring other sections or check back in a few moments.</p>
                </div>`;
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
    }    createStoryCard(story, image, isCategoryCard = false) {        const defaultImage = {
            url: 'img/nyt-logo.jpg',
            caption: 'The New York Times'
        };
        const imageToUse = image || defaultImage;
        const section = story.section ? story.section.charAt(0).toUpperCase() + story.section.slice(1) : '';
        
        return `
            <div class="card">
                <div class="card-img-wrapper">
                    <img src="${imageToUse.url}" alt="${imageToUse.caption}" class="card-img-top" onerror="this.src='${defaultImage.url}'">
                    ${section ? `<div class="category-tag">${section}</div>` : ''}
                </div>
                <div class="card-body">
                    <h3 class="card-title">
                        <a href="${story.url}" target="_blank" rel="noopener noreferrer">${story.title}</a>
                    </h3>
                    ${!isCategoryCard ? `
                        <p class="card-text">${story.abstract}</p>
                        <p class="byline">${story.byline}</p>
                        <span class="date">${this.formatDate(story.published_date)}</span>
                    ` : ''}
                </div>
            </div>
        `;
    }    
    displayStories(stories) {
        this.storiesContainer.innerHTML = '';
        
        // Create main container row
        const mainRow = document.createElement('div');
        mainRow.className = 'row mb-4';        // Top Stories header
        const topStoriesHeader = document.createElement('div');
        topStoriesHeader.className = 'col-12 mb-3 px-0';
        topStoriesHeader.innerHTML = '<h2 class="px-0">Top Stories</h2>';
        mainRow.appendChild(topStoriesHeader);

        // Top story (double-wide)
        const topStory = stories[0];
        const topImage = topStory.multimedia?.find(media => 
            media.type === 'image' && 
            (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
        );const topStoryElement = document.createElement('div');
        topStoryElement.className = 'col-12 col-sm-8 mb-4 top-story';
        topStoryElement.innerHTML = this.createStoryCard(topStory, topImage);
        mainRow.appendChild(topStoryElement);// News Sections card (visible on XL and LG screens)
        const controlsElement = document.createElement('div');
        controlsElement.className = 'col-md-4 mb-4 d-none d-lg-block';
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
        mainRow.appendChild(controlsElement);

        this.storiesContainer.appendChild(mainRow);

        // Regular stories grid - starts from index 1
        const storiesRow = document.createElement('div');
        storiesRow.className = 'row';
        
        // Add all regular stories (excluding last 8 which are for mini cards)
        for (let i = 1; i < stories.length - 8; i++) {
            const story = stories[i];
            const image = story.multimedia?.find(media => 
                media.type === 'image' && 
                (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
            );
            const storyElement = document.createElement('div');
            storyElement.className = 'col-12 col-sm-6 col-lg-4 mb-4';
            storyElement.innerHTML = this.createStoryCard(story, image);
            storiesRow.appendChild(storyElement);        }
        this.storiesContainer.appendChild(storiesRow);        // First row of mini cards
        const firstRowCategories = ['Politics', 'World', 'Opinion', 'Business'];
        const firstCategoryRow = document.createElement('div');
        firstCategoryRow.className = 'row mb-4';
        
        Promise.all(firstRowCategories.map((category, index) => {
            const url = `${this.baseUrl}/${category.toLowerCase()}.json?api-key=${this.apiKey}`;
            return fetch(url)
                .then(response => response.json())
                .then(data => {
                    const categoryCol = document.createElement('div');
                    // Hide last card at small breakpoint, show at xs and md+
                    if (index === 3) {
                        categoryCol.className = 'col-6 col-sm-4 col-md-3 d-sm-none d-md-block d-block';
                    } else {
                        categoryCol.className = 'col-6 col-sm-4 col-md-3';
                    }

                    const header = document.createElement('h2');
                    header.className = 'section-header mb-3';
                    header.setAttribute('data-section', category.toLowerCase());
                    header.innerHTML = `${category} >`;
                    header.addEventListener('click', () => {
                        this.sectionSelect.value = category.toLowerCase();
                        this.loadStories();
                        window.scrollTo(0, 0);
                    });
                    
                    categoryCol.appendChild(header);

                    if (data.results && data.results.length > 0) {
                        const story = data.results[0];
                        const image = story.multimedia?.find(media => 
                            media.type === 'image' && 
                            (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
                        );
                        const miniCard = document.createElement('div');
                        miniCard.innerHTML = this.createStoryCard(story, image, true);
                        categoryCol.appendChild(miniCard);
                    }

                    firstCategoryRow.appendChild(categoryCol);
                })
                .catch(error => console.error(`Error fetching ${category} story:`, error));
        })).then(() => {
            this.storiesContainer.insertBefore(firstCategoryRow, storiesRow);
        });

        // Second row of mini cards
        const secondRowCategories = ['Arts', 'Science', 'Technology', 'Health'];
        const secondCategoryRow = document.createElement('div');
        secondCategoryRow.className = 'row mb-4';          Promise.all(secondRowCategories.map((category, index) => {
            const url = `${this.baseUrl}/${category.toLowerCase()}.json?api-key=${this.apiKey}`;
            return fetch(url)
                .then(response => response.json())
                .then(data => {
                    const categoryCol = document.createElement('div');
                    // Hide last card at small breakpoint, show at xs and md+
                    if (index === 3) {
                        categoryCol.className = 'col-6 col-sm-4 col-md-3 d-sm-none d-md-block d-block';
                    } else {
                        categoryCol.className = 'col-6 col-sm-4 col-md-3';
                    }

                    const header = document.createElement('h2');
                    header.className = 'section-header mb-3';
                    header.setAttribute('data-section', category.toLowerCase());
                    header.innerHTML = `${category} >`;
                    header.addEventListener('click', () => {
                        this.sectionSelect.value = category.toLowerCase();
                        this.loadStories();
                        window.scrollTo(0, 0);
                    });
                    
                    categoryCol.appendChild(header);

                    if (data.results && data.results.length > 0) {
                        const story = data.results[0];
                        const image = story.multimedia?.find(media => 
                            media.type === 'image' && 
                            (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
                        );
                        const miniCard = document.createElement('div');
                        miniCard.innerHTML = this.createStoryCard(story, image, true);
                        categoryCol.appendChild(miniCard);
                    }

                    secondCategoryRow.appendChild(categoryCol);
                })
                .catch(error => console.error(`Error fetching ${category} story:`, error));
        })).then(() => {
            this.storiesContainer.appendChild(secondCategoryRow);
        }); // Close the Promise.all
    } // Close the displayStories method
    findArticleImage(story) {
        return story.multimedia?.find(media => 
            media.type === 'image' && 
            (media.format === 'Super Jumbo' || media.format === 'threeByTwoSmallAt2X')
        ) || {
            url: 'https://upload.wikimedia.org/wikipedia/commons/7/77/The_New_York_Times_logo.png',
            caption: 'The New York Times'
        };
    }

    initializeSelects() {
        const options = [
            { value: 'home', text: 'Home' },
            { value: 'arts', text: 'Arts' },
            { value: 'business', text: 'Business' },
            { value: 'dining', text: 'Dining' },
            { value: 'fashion', text: 'Fashion' },
            { value: 'health', text: 'Health Magazine' },
            { value: 'opinion', text: 'National Opinion' },
            { value: 'politics', text: 'Politics' },
            { value: 'realestate', text: 'Real Estate' },
            { value: 'science', text: 'Science' },
            { value: 'sports', text: 'Sports' },
            { value: 'technology', text: 'Technology' },
            { value: 'world', text: 'World' }
        ];

        const selects = [
            document.getElementById('mobileSectionSelect'),
            document.getElementById('footerMobileSectionSelect'),
            this.sectionSelect,
            this.footerSectionSelect
        ];

        selects.forEach(select => {
            if (select) {
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    select.appendChild(option);
                });
            }
        });
    }    syncSelects(value) {
        console.log('Syncing selects to value:', value);
        // Sync all select dropdowns to the same value
        const selects = [
            this.sectionSelect,
            this.mobileSectionSelect,
            this.footerSectionSelect,
            this.footerMobileSectionSelect
        ];
        
        selects.forEach(select => {
            if (select) {
                select.value = value;
                console.log(`Set ${select.id} to ${value}`);
            }
        });
    }
} // End of NYTNewsApp class

// Stock Ticker functionality
class StockTicker {
    constructor() {
        this.apiKey = 'd170nppr01qkv5jdqv2gd170nppr01qkv5jdqv30';
        this.baseUrl = 'https://finnhub.io/api/v1';
        this.tickerElement = document.getElementById('stockTicker');
        this.symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'SPY', 'DIA', 'QQQ', 'VTI'];
        this.initializeTicker();
    }

    async fetchStockQuote(symbol) {
        try {
            const response = await fetch(`${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`);
            if (!response.ok) throw new Error('API request failed');
            const data = await response.json();
            return { symbol, ...data };
        } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
            return null;
        }
    }

    formatPrice(price) {
        return price.toFixed(2);
    }

    formatChange(change, changePercent) {
        const sign = change >= 0 ? '+' : '';
        return `${sign}${this.formatPrice(change)} (${sign}${this.formatPrice(changePercent)}%)`;
    }

    createStockElement(stockData) {
        if (!stockData) return '';
        
        const change = stockData.c - stockData.pc; // Current - Previous Close
        const changePercent = (change / stockData.pc) * 100;
        const changeClass = change >= 0 ? 'stock-change-positive' : 'stock-change-negative';

        return `<span class="stock-item">${stockData.symbol}: $${this.formatPrice(stockData.c)} <span class="${changeClass}">${this.formatChange(change, changePercent)}</span></span>`;
    }

    async initializeTicker() {
        try {
            // Fetch all stock data in parallel
            const stockDataPromises = this.symbols.map(symbol => this.fetchStockQuote(symbol));
            const stockDataResults = await Promise.all(stockDataPromises);
            
            // Filter out any failed requests and create the ticker content
            const tickerContent = stockDataResults
                .filter(data => data !== null)
                .map(data => this.createStockElement(data))
                .join('');

            // Add the content four times to ensure smooth looping
            this.tickerElement.innerHTML = tickerContent.repeat(4);
        } catch (error) {
            console.error('Error initializing stock ticker:', error);
            this.tickerElement.innerHTML = '<span class="stock-item">Unable to load stock data</span>';
        }
    }
}

// Initialize both the NYT News App and Stock Ticker when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NYTNewsApp();
    new StockTicker();
});
