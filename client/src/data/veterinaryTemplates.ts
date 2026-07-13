import type { MedicalTemplate } from "./medicalTemplates";

const lastQ = "Is there anything else you'd like us to know about your pet?";

export const veterinaryTemplates: MedicalTemplate[] = [
  {
    id: "canine-wellness", condition: "Canine Wellness Exam", category: "Veterinary", severity: "low",
    questions: ["How is your dog's energy level today?", "Is your dog eating and drinking normally?", "Have you noticed any changes in your dog's weight?", "Is your dog up to date on vaccinations?", "Have you been giving heartworm prevention medication?", "Is your dog on flea and tick prevention?", "How are your dog's bowel movements?", "Have you noticed any limping or stiffness?", "How is your dog's appetite?", "Any changes in behavior or mood?", lastQ],
  },
  {
    id: "feline-wellness", condition: "Feline Wellness Check", category: "Veterinary", severity: "low",
    questions: ["How is your cat doing today?", "Is your cat eating and drinking normally?", "Have you noticed any changes in litter box habits?", "Is your cat using the litter box regularly?", "Have you noticed any vomiting or hairballs?", "Is your cat's coat looking healthy?", "How is your cat's energy level?", "Has your cat had any sneezing or coughing?", "Is your cat up to date on vaccinations?", "Have you noticed any changes in appetite or weight?", lastQ],
  },
  {
    id: "puppy-vaccination", condition: "Puppy Vaccination Series", category: "Veterinary", severity: "moderate",
    questions: ["How old is your puppy now?", "Has your puppy had any reactions to previous vaccines?", "Is your puppy eating and playing normally?", "Have you noticed any vomiting or diarrhea?", "Has your puppy been around other dogs?", "Is your puppy on heartworm prevention?", "Have you started house training?", "Has your puppy had any coughing or sneezing?", "Is your puppy drinking water normally?", "Any concerns about your puppy's development?", lastQ],
  },
  {
    id: "vet-dental", condition: "Veterinary Dental Cleaning", category: "Veterinary", severity: "moderate",
    questions: ["Have you noticed bad breath in your pet?", "Is your pet eating normally?", "Have you seen any bleeding from the gums?", "Is your pet drooling more than usual?", "Has your pet been pawing at the mouth?", "Have you noticed any loose or broken teeth?", "Is your pet chewing on one side only?", "Have you seen any swelling around the face?", "When was the last dental cleaning?", "Any change in chewing behavior?", lastQ],
  },
  {
    id: "heartworm-prevention", condition: "Heartworm Prevention Check", category: "Veterinary", severity: "moderate",
    questions: ["Is your pet on monthly heartworm prevention?", "When was the last heartworm test?", "Has your pet been coughing or wheezing?", "Is your pet lethargic or tired?", "Has your pet lost weight recently?", "Is your pet breathing normally?", "Have you missed any doses of prevention medication?", "Has your pet been tested for heartworm this year?", "Is your pet eating well?", "Have you noticed any swelling in the abdomen?", lastQ],
  },
  {
    id: "vet-emergency", condition: "Emergency / Toxin Ingestion", category: "Veterinary", severity: "critical",
    questions: ["What did your pet ingest and how much?", "How long ago did this happen?", "Is your pet conscious and alert?", "Is your pet breathing normally?", "Has your pet vomited?", "Can your pet stand and walk?", "What is your pet's approximate weight?", "Have you contacted a poison control center?", "Is your pet having seizures?", "Do you have the packaging of what was ingested?", lastQ],
  },
  {
    id: "vet-post-surgery", condition: "Post-Surgery Recovery (Vet)", category: "Veterinary", severity: "high",
    questions: ["How many days since your pet's surgery?", "Is your pet eating and drinking normally?", "Is the surgical incision clean and dry?", "Have you noticed any redness or swelling?", "Is your pet wearing the recovery cone?", "Have you given the prescribed medications?", "Is your pet urinating and defecating normally?", "Have you noticed any discharge from the incision?", "Is your pet's energy level returning to normal?", "Do you have the follow-up appointment scheduled?", lastQ],
  },
  {
    id: "vet-dermatology", condition: "Dermatology / Allergies (Pet)", category: "Veterinary", severity: "moderate",
    questions: ["Is your pet scratching more than usual?", "Have you noticed any skin redness or rash?", "Is there any hair loss or bald spots?", "Have you seen fleas or ticks on your pet?", "Is your pet licking its paws excessively?", "Have you changed your pet's food recently?", "Is your pet shaking its head or scratching ears?", "Have you noticed any hot spots on the skin?", "Is your pet on any allergy medication?", "Have you noticed any odor from the skin or ears?", lastQ],
  },
  {
    id: "vet-arthritis", condition: "Arthritis / Mobility (Pet)", category: "Veterinary", severity: "moderate",
    questions: ["Is your pet having trouble getting up or lying down?", "Have you noticed limping or stiffness?", "Is your pet reluctant to go up or down stairs?", "Is your pet on any joint supplements?", "Has your pet's activity level decreased?", "Does your pet seem painful when touched in certain areas?", "Is your pet having trouble jumping onto furniture?", "Have you noticed any muscle loss in the back legs?", "Is your pet gaining weight due to less activity?", "Have you tried any pain medications or therapies?", lastQ],
  },
  {
    id: "equine-wellness", condition: "Equine Wellness", category: "Veterinary", severity: "moderate",
    questions: ["How is your horse's appetite today?", "Is your horse drinking water normally?", "Have you noticed any lameness?", "Is your horse's coat condition normal?", "Are the hooves in good condition?", "Has your horse had any coughing or nasal discharge?", "Is your horse up to date on vaccinations?", "Have you noticed any weight changes?", "How is your horse's manure consistency?", "Have you done deworming recently?", lastQ],
  },
  {
    id: "avian-exotic", condition: "Exotic Pet Health Check", category: "Veterinary", severity: "moderate",
    questions: ["What type of exotic pet do you have?", "Is your pet eating and drinking normally?", "Have you noticed any changes in activity level?", "Is the enclosure at proper temperature and humidity?", "Have you noticed any changes in droppings?", "Is your pet breathing normally?", "Has your pet been shedding or molting normally?", "Any changes in appearance or color?", "Is your pet behaving normally?", "Do you have any concerns about your pet's habitat?", lastQ],
  },
];
