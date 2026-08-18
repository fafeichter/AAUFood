// Font Awesome icon components (JS logic that watches the DOM and swaps
// <i class="fas fa-x"> tags for inline SVGs). The base Font Awesome *styles*
// live in their own bundle (fontawesome.scss) — see app/public/fontawesome-styles.js.
// Only the icons actually used on the site are included to keep bundle.js small.
import {config, dom, library} from '@fortawesome/fontawesome-svg-core';

// Solid icons
import {
    faAngleLeft,
    faAngleRight,
    faBalanceScale,
    faBed,
    faBook,
    faCalendarTimes,
    faClock,
    faFrown,
    faGamepad,
    faGlassCheers,
    faGlobeAmericas,
    faHandLizard,
    faHandPaper,
    faHeart,
    faKeyboard,
    faMapSigns,
    faPaintRoller,
    faRocket,
    faSnowboarding,
    faSnowflake,
    faStar,
    faTree,
    faUmbrellaBeach,
    faUsers,
    faUtensils
} from '@fortawesome/free-solid-svg-icons';

// Brands
import {faEmpire, faGithub, faRebel} from '@fortawesome/free-brands-svg-icons';

// Prevent FontAwesome from dynamically inserting its CSS into <head> since it's already in fontawesome.scss
config.autoAddCss = false;

// Register only the specific required icons for tree-shaking
library.add(
    // Solid
    faAngleLeft, faAngleRight, faBalanceScale, faBed, faBook, faCalendarTimes,
    faClock, faFrown, faGamepad, faGlassCheers, faGlobeAmericas, faHandLizard, faHandPaper,
    faHeart, faMapSigns, faPaintRoller, faRocket, faSnowboarding, faSnowflake,
    faStar, faTree, faUmbrellaBeach, faUsers, faUtensils, faKeyboard,
    // Brands
    faEmpire, faGithub, faRebel,
);

// Watch the DOM for icon tags (e.g., <i class="fab fa-github"></i>) and replace them with SVGs
dom.watch();