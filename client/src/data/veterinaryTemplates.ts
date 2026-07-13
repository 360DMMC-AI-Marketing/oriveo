import type { MedicalTemplate } from "./medicalTemplates";

const lastQ = "Is there anything else you'd like us to know about your pet?";

export const veterinaryTemplates: MedicalTemplate[] = [
  {
    id: "canine-wellness", condition: "Canine Wellness Exam", category: "Veterinary", severity: "low",
    description: "Annual wellness per AAHA Canine Life Stage Guidelines. Includes vital assessment, nutrition, parasite prevention, vaccination review, and breed-specific screening recommendations.",
    questions: ["How is your dog's energy level and appetite today?", "Is your dog drinking water normally and urinating regularly?", "Is your dog up to date on all vaccinations (rabies, DHPP, Bordetella)?", "Have you been giving monthly heartworm prevention and flea/tick control?", "How are your dog's bowel movements — normal consistency and frequency?", "Have you noticed any limping, stiffness, or difficulty getting up or lying down?", "Is your dog's coat healthy and shiny? Any hair loss or excessive shedding?", "Have you noticed any coughing, sneezing, or nasal discharge?", "Has your dog's weight changed significantly since the last visit?", "Any changes in behavior, such as increased anxiety or aggression?", lastQ],
  },
  {
    id: "feline-wellness", condition: "Feline Wellness Check", category: "Veterinary", severity: "low",
    description: "Annual feline wellness per AAFP Feline Life Stage Guidelines. Cats hide illness — emphasis on subtle changes in behavior, litter box habits, appetite, and weight trends.",
    questions: ["How is your cat's appetite and water intake today?", "Is your cat using the litter box normally — frequency, consistency, any straining?", "Have you noticed any vomiting, hairballs, or gagging since the last visit?", "Is your cat's coat healthy or have you noticed excessive grooming or hair loss?", "How is your cat's energy level — playing, exploring, or hiding more than usual?", "Is your cat up to date on vaccinations (FVRCP, FeLV, rabies)?", "Have you noticed any sneezing, coughing, or eye discharge?", "Has your cat's weight changed — has the ribs become more prominent?", "Have you noticed any changes in your cat's behavior or litter box habits?", "Is your cat on flea/tick prevention and has it had a recent stool check?", lastQ],
  },
  {
    id: "puppy-vaccination", condition: "Puppy Vaccination Series", category: "Veterinary", severity: "moderate",
    description: "Core vaccination series starting at 6-8 weeks per AAHA/AAFP guidelines. Includes boosters every 3-4 weeks until 16 weeks, deworming, and early socialization guidance.",
    questions: ["How old is your puppy now and what breed?", "Is your puppy eating, drinking, and playing normally?", "Has your puppy had any reactions to previous vaccines (swelling, fever, lethargy)?", "Have you noticed any vomiting, diarrhea, or changes in stool?", "Has your puppy been around other dogs, parks, or areas where other dogs frequent?", "Is your puppy on heartworm prevention and deworming schedule?", "Have you started house training — how is it going?", "Has your puppy had any coughing, sneezing, or eye discharge?", "Is your puppy drinking enough water throughout the day?", "Do you have any concerns about your puppy's behavior or development?", lastQ],
  },
  {
    id: "vet-dental", condition: "Veterinary Dental Cleaning", category: "Veterinary", severity: "moderate",
    description: "Professional dental cleaning under anesthesia per AAHA Dental Care Guidelines. Dental disease is the most common health problem in dogs and cats over 3 years of age.",
    questions: ["Have you noticed bad breath (halitosis) in your pet?", "Is your pet eating normally or showing any hesitation when chewing?", "Have you seen any bleeding from the gums or drool with blood?", "Is your pet drooling more than usual or pawing at the mouth?", "Have you noticed any loose, broken, or discolored teeth?", "Is your pet chewing on only one side of the mouth?", "Have you seen any swelling around the face, jaw, or under the eyes?", "When was the last dental cleaning or oral exam under anesthesia?", "Has your pet had any difficulty picking up food or dropping food while eating?", "Have you been brushing your pet's teeth or using dental chews?", lastQ],
  },
  {
    id: "heartworm-prevention", condition: "Heartworm Prevention Check", category: "Veterinary", severity: "moderate",
    description: "Heartworm disease (Dirofilaria immitis) transmitted by mosquitoes. AHS guidelines recommend year-round prevention and annual antigen testing for all dogs in endemic areas.",
    questions: ["Is your pet on monthly heartworm prevention and when was the last dose given?", "When was the last heartworm antigen test performed and was it negative?", "Has your pet been coughing or wheezing — especially after exercise?", "Is your pet lethargic, tiring easily, or reluctant to exercise?", "Has your pet lost weight or had a decreased appetite recently?", "Is your pet breathing normally or is there any rapid or labored breathing?", "Have you missed any doses of heartworm medication in the past 6 months?", "Has your pet been tested for tick-borne diseases (Lyme, Ehrlichia, Anaplasma)?", "Is your pet eating and drinking normally?", "Have you noticed any swelling in the abdomen or fluid buildup?", lastQ],
  },
  {
    id: "vet-emergency", condition: "Emergency / Toxin Ingestion", category: "Veterinary", severity: "critical",
    description: "Emergency triage per VECCS guidelines. Covers toxin ingestion, trauma, acute collapse, respiratory distress, seizures, and GDV. Immediate life-threatening conditions require prioritization of ABCs.",
    questions: ["What did your pet ingest and how much — do you have the packaging?", "How long ago did the ingestion, injury, or symptom onset occur?", "Is your pet conscious and alert? Can it stand and walk?", "Is your pet breathing normally — count the breaths per minute if possible?", "Has your pet vomited — what did it look like and how many times?", "What is your pet's approximate weight and breed?", "Have you contacted a pet poison control center (ASPCA or Pet Poison Helpline)?", "Is your pet having seizures, tremors, or uncontrollable muscle movements?", "Is there any active bleeding, injury, or known trauma?", "Can you bring or send a photo of what was ingested and the packaging?", lastQ],
  },
  {
    id: "vet-post-surgery", condition: "Post-Surgery Recovery (Vet)", category: "Veterinary", severity: "high",
    description: "Post-operative monitoring per ACVS guidelines. Covers incision assessment, pain control, appetite return, elimination, and activity restrictions. Early detection of surgical site infection is critical.",
    questions: ["How many days has it been since your pet's surgery?", "Is your pet eating and drinking normally?", "Is the surgical incision clean, dry, and free of redness or discharge?", "Have you noticed any swelling, warmth, or odor around the incision site?", "Is your pet wearing the protective cone or collar to prevent licking?", "Have you given all prescribed medications including antibiotics and pain relievers?", "Is your pet urinating and defecating normally?", "Is your pet's energy level returning to normal for its age and breed?", "Are you following the activity restriction and leash walk instructions?", "Do you have the follow-up appointment scheduled for suture removal?", lastQ],
  },
  {
    id: "vet-dermatology", condition: "Dermatology / Allergies (Pet)", category: "Veterinary", severity: "moderate",
    description: "Canine and feline dermatology per ACVD guidelines. Includes pruritus assessment, lesion identification, ectoparasite control, food/environmental allergy workup, and otitis evaluation.",
    questions: ["How would you rate your pet's itching on a scale of 1 to 10?", "Have you noticed any skin redness, rash, bumps, or hair loss?", "Is your pet licking its paws, rubbing its face, or chewing on its skin?", "Have you seen fleas, flea dirt, or ticks on your pet?", "Has your pet been shaking its head or scratching its ears?", "Have you changed your pet's food, treats, or chews recently?", "Have you noticed any hot spots, scabs, or crusty patches on the skin?", "Is your pet on any allergy medication (Apoquel, Cytopoint, steroids, immunotherapy)?", "Have you noticed any odor coming from the skin or ears?", "Does your pet have seasonal changes in itching or year-round symptoms?", lastQ],
  },
  {
    id: "vet-arthritis", condition: "Arthritis / Mobility (Pet)", category: "Veterinary", severity: "moderate",
    description: "Osteoarthritis in dogs and cats per AAHA Pain Management Guidelines. Prevalence increases with age — affects ~20% of adult dogs. Multimodal management includes weight control, joint supplements, NSAIDs, and physical therapy.",
    questions: ["Is your pet having trouble getting up or lying down?", "Have you noticed limping or stiffness — especially after rest or in cold weather?", "Is your pet reluctant to go up or down stairs or jump onto furniture?", "Is your pet on any joint supplements (glucosamine, chondroitin, omega-3s)?", "Has your pet's activity level or playfulness decreased noticeably?", "Does your pet seem painful when touched in certain areas (back, hips, legs)?", "Has your pet gained weight or is it less willing to go for walks?", "Have you tried any pain medications or therapies (cold laser, acupuncture, NSAIDs)?", "Have you noticed muscle loss, especially in the back legs or along the spine?", "Have you made any home modifications (ramps, non-slip flooring, orthopedic bed)?", lastQ],
  },
  {
    id: "equine-wellness", condition: "Equine Wellness", category: "Veterinary", severity: "moderate",
    description: "Equine preventive care per AAEP guidelines. Includes dental floating, vaccination (EWT, West Nile, Rabies), deworming, hoof care, and senior horse management.",
    questions: ["How is your horse's appetite and water intake today?", "Have you noticed any lameness or gait abnormality?", "Is your horse's coat condition normal — shiny or dull?", "When was the last hoof trim or farrier visit? Any hoof issues?", "Has your horse had any coughing, nasal discharge, or fever recently?", "Is your horse up to date on vaccinations (EWT, West Nile, Rabies, Strangles)?", "Have you noticed any weight change, loss of muscle, or pot-bellied appearance?", "When was the last deworming and fecal egg count performed?", "Has your horse had any colic episodes or changes in manure consistency?", "How is your horse's dental health — any difficulty chewing or quidding?", lastQ],
  },
  {
    id: "avian-exotic", condition: "Exotic Pet Health Check", category: "Veterinary", severity: "moderate",
    description: "Exotic pet wellness per AAV (avian) and exotic mammal guidelines. Preventative care focuses on proper husbandry — diet, enclosure, temperature, humidity, UVB lighting — as most diseases stem from inadequate care.",
    questions: ["What species of exotic pet do you have and how old is it?", "Is your pet eating and drinking normally for its species?", "Have you noticed any change in activity level or behavior?", "What are the enclosure temperature and humidity levels currently?", "Have you noticed any changes in droppings — color, consistency, or frequency?", "Is your pet breathing normally — any wheezing, clicking, or tail bobbing?", "Has your pet been shedding or molting normally?", "Are you providing proper UVB lighting and calcium supplementation?", "Have you noticed any changes in appearance — feather/scale quality, eye clarity?", "Do you have any concerns about your pet's habitat or diet?", lastQ],
  },
];
