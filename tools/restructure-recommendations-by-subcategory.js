const fs = require('fs');
const path = require('path');

// Load the questions config and current recommendations
const questionsPath = path.join(__dirname, '../server/app/config/climate_assessment_questions.json');
const recsPath = path.join(__dirname, '../server/app/config/climate_assessment_dimension_recommendations.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
const recs = JSON.parse(fs.readFileSync(recsPath, 'utf8'));

// Map question keys to subcategory labels
const getSubcategoryLabel = (questionKey) => {
  const subcategoryMap = {
    'livelihoods_food_security': 'Food Security',
    'livelihoods_grazing': 'Grazing/Farm Land',
    'livelihoods_crops': 'Crops',
    'livelihoods_livestock': 'Livestock',
    'livelihoods_fishstock': 'Fishstock',
    'exp_local_commerce': 'Local commerce',
    'exp_gender': 'Gender',
    'exp_conviviality': 'Conviviality',
    'exp_education': 'Education',
    'exp_wfi_wfdu': 'WFI/WFDU',
    'exp_atf_i': 'ATF/I',
    'exp_disaster_events': 'Disaster Events',
  };
  return subcategoryMap[questionKey] || questionKey;
};

// Restructure recommendations to be subcategory-specific
const restructureRecommendations = () => {
  const newRecs = {};
  
  // Only process exposure dimension
  const dim = 'exposure';
  const dimConfig = questions[dim];
  if (!dimConfig || !dimConfig.categories) return newRecs;
  
  newRecs[dim] = {};
  
  for (const cat of dimConfig.categories) {
    if (!cat.questions || cat.questions.length === 0) continue;
    
    newRecs[dim][cat.key] = {
      label: cat.label,
      subcategories: {}
    };
    
    // Get category-level recommendations
    const catRecs = recs[dim]?.[cat.key];
    if (!catRecs) continue;
    
    // For each question (subcategory), create subcategory-specific recommendations
    for (const q of cat.questions) {
      const subcatKey = q.key;
      const subcatLabel = getSubcategoryLabel(subcatKey);
      
      // Use category-level recommendations for each subcategory
      // Each subcategory will have its own rating based on its individual score
      newRecs[dim][cat.key].subcategories[subcatKey] = {
        label: subcatLabel,
        ratings: {
          Low: {
            planning: catRecs.ratings?.Low?.planning || [],
            designs: catRecs.ratings?.Low?.designs || [],
            communityDevelopmentPlans: catRecs.ratings?.Low?.communityDevelopmentPlans || []
          },
          Medium: {
            planning: catRecs.ratings?.Medium?.planning || [],
            designs: catRecs.ratings?.Medium?.designs || [],
            communityDevelopmentPlans: catRecs.ratings?.Medium?.communityDevelopmentPlans || []
          },
          High: {
            planning: catRecs.ratings?.High?.planning || [],
            designs: catRecs.ratings?.High?.designs || [],
            communityDevelopmentPlans: catRecs.ratings?.High?.communityDevelopmentPlans || []
          }
        }
      };
    }
  }
  
  return newRecs;
};

// Generate the new structure
const newRecs = restructureRecommendations();

// Save to file
const outputPath = path.join(__dirname, '../server/app/config/climate_assessment_dimension_recommendations.json');
fs.writeFileSync(outputPath, JSON.stringify(newRecs, null, 2));

console.log('✅ Restructured recommendations to be subcategory-specific');
console.log(`📁 Saved to: ${outputPath}`);

// Show summary
let totalSubcategories = 0;
Object.keys(newRecs.exposure || {}).forEach(catKey => {
  const subcatCount = Object.keys(newRecs.exposure[catKey].subcategories || {}).length;
  totalSubcategories += subcatCount;
  console.log(`  ${catKey}: ${subcatCount} subcategories`);
});

console.log(`\n📊 Total: ${totalSubcategories} subcategories with recommendations`);
