import type { MedicalTemplate } from "./medicalTemplates";

const lastQ = "Do you have any other dental concerns you'd like to discuss?";

export const dentalTemplates: MedicalTemplate[] = [
  // ── General Dentistry ─────────────────────────────────────────────
  {
    id: "general-dental", condition: "General Dental Checkup", category: "Dental", severity: "low",
    description: "Comprehensive oral examination per ADA guidelines. Includes periodontal probing, caries detection, oral cancer screening, radiographic assessment, and preventive care planning.",
    questions: ["When was your last dental cleaning and exam?", "Are you brushing twice daily with fluoride toothpaste and flossing regularly?", "Have you noticed any tooth pain, sensitivity to hot or cold, or discomfort?", "Do your gums bleed when you brush or floss?", "Have you noticed any loose teeth, changes in bite, or shifting of teeth?", "Do you have any crowns, bridges, implants, or fillings that concern you?", "Are you experiencing any jaw pain, clicking, or difficulty opening your mouth?", "Do you smoke, vape, or use tobacco products?", "Have you noticed any sores, lumps, or persistent spots in your mouth?", "Do you have any medical conditions (diabetes, heart disease) or take blood thinners?", lastQ],
    specialties: ["general-dentistry"],
  },
  {
    id: "dental-emergency", condition: "Dental Emergency", category: "Dental", severity: "critical",
    description: "Emergency dental triage per ADA guidelines. Includes severe pain, dental trauma (avulsed/fractured tooth), swelling, abscess, and uncontrolled bleeding. Immediate assessment determines urgency.",
    questions: ["Can you describe your dental emergency — pain, trauma, or swelling?", "Rate your pain level from 0 to 10?", "Have you lost, broken, or chipped a tooth? Do you have the pieces?", "Is there active bleeding that hasn't stopped with pressure?", "Do you have swelling in your face, jaw, or neck that affects breathing or swallowing?", "Can you breathe and swallow normally?", "Have you injured your jaw, mouth, or face from a fall or accident?", "Do you have a dental abscess — pus, fever, or foul taste in your mouth?", "Are you able to see a dentist today or go to an emergency room?", "Have you taken any pain medication? What and how much?", lastQ],
    specialties: ["general-dentistry", "endodontics", "periodontics", "oral-surgery"],
  },
  {
    id: "dental-cavity", condition: "Cavity / Filling Assessment", category: "Dental", severity: "moderate",
    description: "Caries assessment and filling evaluation per ADA/IOH guidelines. Covers cavity detection, restoration integrity, fluoride assessment, and caries risk management using CAMBRA protocol.",
    questions: ["Which tooth is bothering you and what symptoms are you experiencing?", "Do you feel pain when eating sweet foods, drinking cold beverages, or biting down?", "Have you noticed any dark spots, holes, or rough areas on your teeth?", "Do you have an existing filling that feels cracked, loose, or has food catching around it?", "How often do you brush and floss, and do you use fluoride toothpaste?", "How frequently do you consume sugary foods, snacks, or acidic beverages?", "Have you had new cavities since your last dental visit?", "Do you have dry mouth from medications or medical conditions?", "Are you experiencing any spontaneous or lingering tooth pain?", "When was your last bitewing X-ray and dental cleaning?", lastQ],
    specialties: ["general-dentistry"],
  },
  {
    id: "tooth-sensitivity", condition: "Tooth Sensitivity", category: "Dental", severity: "low",
    description: "Dentin hypersensitivity evaluation per ADA guidelines. Covers trigger identification (thermal, osmotic, tactile), recession assessment, erosion screening, and desensitizing treatment options.",
    questions: ["Which teeth are sensitive and what triggers the pain — cold, hot, sweet, or brushing?", "Is the sensitivity sharp and brief or lingering and throbbing?", "Have you noticed gum recession — do your teeth look longer?", "Do you grind or clench your teeth, especially at night?", "Are you using a desensitizing toothpaste and how long have you been using it?", "Do you brush aggressively with a hard-bristle toothbrush?", "Do you consume acidic foods or drinks frequently — citrus, soda, wine?", "Have you had recent dental work that may have caused sensitivity?", "Does the sensitivity interfere with eating, drinking, or oral hygiene?", "Have you tried fluoride varnish or other in-office desensitizing treatments?", lastQ],
    specialties: ["general-dentistry"],
  },
  {
    id: "dental-abscess", condition: "Dental Abscess / Infection", category: "Dental", severity: "high",
    description: "Odontogenic infection assessment per ADA/AAE guidelines. Covers abscess localization, cellulitis screening, antibiotic management, and urgent drainage needs. Spreading infection is a medical emergency.",
    questions: ["Where exactly is the swelling or pain located in your mouth or face?", "Do you have a pimple-like bump on your gums that drains pus or has a foul taste?", "Are you experiencing fever, chills, or feeling unwell?", "Is the swelling affecting your ability to open your mouth, swallow, or breathe?", "Are you taking antibiotics as prescribed — and have you completed the full course?", "Did the tooth have recent dental work, trauma, or deep decay?", "Are you experiencing severe, throbbing pain that wakes you up at night?", "Have you applied warm salt water rinses to the affected area?", "Is the swelling progressing or spreading to your cheek, neck, or under the eye?", "Do you need urgent drainage or root canal treatment for this infection?", lastQ],
    specialties: ["general-dentistry", "endodontics"],
  },

  // ── Orthodontics ──────────────────────────────────────────────────
  {
    id: "orthodontic", condition: "Orthodontic Adjustment Check", category: "Dental", severity: "low",
    description: "Routine orthodontic progress assessment per AAO guidelines. Tracks tooth movement, appliance integrity, oral hygiene compliance, and any discomfort or complications from treatment.",
    questions: ["How long have you been in orthodontic treatment?", "Are you experiencing any discomfort, soreness, or pain from your braces or aligners?", "Have you noticed any broken brackets, loose bands, or bent wires?", "Are you wearing your elastic bands or aligners for the prescribed hours per day?", "Do you have any sores, ulcers, or irritation inside your lips or cheeks?", "Are you brushing and flossing around your braces carefully?", "Have you been avoiding hard, sticky, or crunchy foods as instructed?", "Have you noticed any changes in your bite or tooth alignment?", "Are you using orthodontic wax for any sharp or poking areas?", "Do you have any questions about your treatment plan or timeline?", lastQ],
    specialties: ["orthodontics"],
  },
  {
    id: "invisalign-check", condition: "Clear Aligner Progress", category: "Dental", severity: "low",
    description: "Clear aligner (Invisalign) progress monitoring per Align Technology guidelines. Covers wear-time compliance, attachment issues, tracking, IPR, and transition between aligner stages.",
    questions: ["How many hours per day are you wearing your aligners — are you meeting the 22-hour goal?", "Do your current aligners fit snugly or are they loose, indicating good tracking?", "Have you had any attachments (bumps) fall off or become loose?", "Are you switching aligners on the schedule your orthodontist provided?", "Have you noticed any attachments catching or irritating your cheeks or tongue?", "Are you using your elastics as prescribed for bite correction?", "Have you had any interproximal reduction (IPR — tooth shaving between teeth)?", "Are your teeth tracking according to the expected progress?", "Do you have any new gaps or rotations that weren't planned?", "Are you using your Vivera retainers or aligner case to protect your aligners?", lastQ],
    specialties: ["orthodontics"],
  },
  {
    id: "orthodontic-emergency", condition: "Broken Bracket / Wire Emergency", category: "Dental", severity: "moderate",
    description: "Orthodontic emergency per AAO guidelines. Covers broken brackets, poking wires, loose bands, and traumatic injuries to oral soft tissues from orthodontic appliances.",
    questions: ["What happened — which bracket broke, wire is loose, or appliance is damaged?", "Is the broken piece causing pain, poking your cheek, or cutting your gum?", "Can you cover the sharp area with orthodontic wax until your repair appointment?", "Have you swallowed or aspirated any loose bracket or wire piece?", "Is there bleeding from the gum or soft tissue around the damaged appliance?", "Are you in significant pain that cannot be managed with over-the-counter pain relievers?", "Can you push the poking wire away from your cheek using a cotton swab or pencil eraser?", "How long has the problem been present and can it wait for a regular appointment?", "Have you taken any pain medication — ibuprofen or acetaminophen?", "Are you able to eat comfortably, or should you switch to soft foods temporarily?", lastQ],
    specialties: ["orthodontics"],
  },

  // ── Endodontics ───────────────────────────────────────────────────
  {
    id: "root-canal", condition: "Root Canal Follow-up", category: "Dental", severity: "high",
    description: "Endodontic treatment assessment per AAE guidelines. Root canal therapy removes infected pulp, seals the canal space, and restores tooth function. Follow-up evaluates healing and symptoms.",
    questions: ["How many days since your root canal procedure?", "Rate your current pain level from 0 to 10?", "Are you taking prescribed pain medication and/or antibiotics as directed?", "Have you noticed any swelling of the gums, face, or around the treated tooth?", "Can you chew on the treated tooth without discomfort?", "Have you had any fever, chills, or signs of infection?", "Is there any discharge, bad taste, or pus coming from the treated area?", "Are you experiencing any sensitivity to hot or cold in that tooth?", "Are you able to open your mouth and bite down normally?", "Have you scheduled the permanent restoration (crown) appointment?", lastQ],
    specialties: ["endodontics"],
  },
  {
    id: "root-canal-retreat", condition: "Root Canal Retreatment", category: "Dental", severity: "high",
    description: "Root canal retreatment per AAE guidelines. Covers persistent or recurrent infection after initial root canal, apical pathology, retreatment prognosis, and comparison to apicoectomy as alternative.",
    questions: ["Why was retreatment recommended — persistent infection, new symptoms, or visible lesion on X-ray?", "Are you experiencing the same symptoms as before your first root canal, or new ones?", "Have you noticed any swelling, drainage, or sinus tract (pimple) on your gum?", "Are you taking your antibiotics and pain medication as prescribed?", "Do you understand that retreatment has a slightly lower success rate than initial root canal?", "Are you aware that a crown or permanent restoration is needed after retreatment?", "Have you had updated X-rays to evaluate the periapical area?", "Are you avoiding chewing on the side of the retreated tooth?", "Do you have any fever, malaise, or feeling of unwellness?", "Are you following up as scheduled to evaluate healing progress?", lastQ],
    specialties: ["endodontics"],
  },
  {
    id: "apical-abscess", condition: "Apical Abscess / Periapical", category: "Dental", severity: "high",
    description: "Periapical abscess assessment per AAE guidelines. Covers acute vs chronic infection, tooth vitality testing, radiographic findings, and definitive treatment planning (root canal vs extraction).",
    questions: ["Which tooth is affected and how long have you had the symptoms?", "Is the pain spontaneous, throbbing, or does it wake you up at night?", "Is the tooth sensitive to biting, percussion, or temperature?", "Do you have swelling, a gum boil, or drainage near the affected tooth?", "Have you had a dental X-ray that shows a dark area (radiolucency) at the root tip?", "Do you have fever, malaise, or facial swelling indicating spreading infection?", "Is the tooth vital (alive) or non-vital based on vitality testing?", "Are you taking antibiotics and have they provided partial relief?", "Has your dentist discussed root canal treatment or extraction as options?", "Are you able to see your dentist or endodontist promptly for definitive treatment?", lastQ],
    specialties: ["endodontics", "general-dentistry"],
  },

  // ── Periodontics ──────────────────────────────────────────────────
  {
    id: "periodontal", condition: "Periodontal / Gum Disease Follow-up", category: "Dental", severity: "moderate",
    description: "Periodontal maintenance per AAP guidelines. Periodontitis is a chronic inflammatory disease requiring regular maintenance at 3-month intervals to prevent disease progression and tooth loss.",
    questions: ["Are you experiencing any gum pain, bleeding, or sensitivity?", "Do your gums bleed when you brush, floss, or eat?", "Have you noticed your gums receding or your teeth looking longer?", "Do you have persistent bad breath (halitosis) or a bad taste in your mouth?", "Have you noticed any pus or discharge between your teeth and gums?", "Do any of your teeth feel loose or are they shifting position?", "Are you using any prescribed mouth rinse or antibiotic gel as directed?", "Have you been keeping your 3-month periodontal maintenance schedule?", "Do you smoke or use tobacco products?", "Have you noticed any changes in how your teeth fit together when biting?", lastQ],
    specialties: ["periodontics"],
  },
  {
    id: "perio-surgery", condition: "Periodontal Surgery Follow-up", category: "Dental", severity: "high",
    description: "Post-periodontal surgery monitoring per AAP guidelines. Covers flap surgery healing, pocket depth reduction, bone graft integration, root surface debridement outcomes, and maintenance protocol.",
    questions: ["How many days has it been since your periodontal surgery?", "Are you experiencing any bleeding, swelling, or pain at the surgical site?", "Are you taking your prescribed antibiotics and pain medication?", "Are you following the soft diet restriction to protect the surgical area?", "Have you noticed any stitches coming loose or any wound opening?", "Are you using the prescribed chlorhexidine rinse instead of regular brushing in the surgical area?", "Do you have any fever, persistent bleeding, or signs of infection?", "How does the surgical area look and feel compared to the first few days after surgery?", "Are you gently resuming oral hygiene in non-surgical areas?", "Do you have your post-surgical follow-up appointment and maintenance schedule?", lastQ],
    specialties: ["periodontics"],
  },
  {
    id: "gum-graft", condition: "Gum Graft Recovery", category: "Dental", severity: "moderate",
    description: "Gingival graft healing monitoring per AAP guidelines. Covers connective tissue graft or free gingival graft outcomes, donor site healing, root coverage, and post-surgical care compliance.",
    questions: ["How many days has it been since your gum graft procedure?", "Is the graft site healing — does it look pink and healthy or is there discoloration?", "Are you experiencing any pain at the graft site or the donor site (palate)?", "Are you avoiding brushing and flossing the graft area as instructed?", "Are you eating soft foods and avoiding the graft area while chewing?", "Have you noticed any swelling, redness, or drainage that suggests graft failure?", "Are you using your prescribed mouth rinse and taking medications?", "Do you feel any numbness or tingling in the grafted area?", "Is the donor site on the roof of your mouth healing without excessive pain?", "When is your follow-up appointment to evaluate graft integration?", lastQ],
    specialties: ["periodontics"],
  },

  // ── Oral Surgery ──────────────────────────────────────────────────
  {
    id: "oral-surgery", condition: "Oral Surgery Recovery", category: "Dental", severity: "high",
    description: "Post-operative monitoring per AAOMS guidelines for procedures including extraction, implant placement, biopsy, and corrective jaw surgery. Focus on pain control, wound healing, and complication detection.",
    questions: ["How many days since your oral surgery procedure?", "Rate your pain level from 0 to 10 and is it improving?", "Are you taking all prescribed medications (pain, antibiotics, mouth rinse) as directed?", "Have you noticed any excessive bleeding or bleeding that won't stop?", "Is there significant swelling — are you applying ice packs as instructed?", "Are you able to eat soft foods and drink enough fluids?", "Have you had any fever, chills, or signs of infection?", "Do you have any numbness or altered sensation in your lips, tongue, or chin?", "Are you following activity restrictions — no strenuous activity or heavy lifting?", "Do you have your follow-up appointment scheduled?", lastQ],
    specialties: ["oral-surgery"],
  },
  {
    id: "dental-implant", condition: "Dental Implant Recovery", category: "Dental", severity: "high",
    description: "Dental implant healing and osseointegration monitoring per AAOMS/ITI guidelines. Covers implant stability, temporary prosthesis care, oral hygiene around implant, and loading protocol compliance.",
    questions: ["How many weeks or months has it been since your implant placement surgery?", "Is the implant area healing well — any pain, swelling, or drainage?", "Are you taking your antibiotics and using the prescribed rinse?", "Are you avoiding chewing on the implant side during the healing period?", "How is the temporary prosthesis or healing cap — any discomfort or loosening?", "Are you brushing gently around the implant and keeping the area clean?", "Have you noticed any implant mobility, which would indicate a problem?", "Are you following up for implant stability measurements (ISQ readings)?", "Are you avoiding smoking, which significantly increases implant failure risk?", "When is your next appointment for implant restoration (crown placement)?", lastQ],
    specialties: ["oral-surgery", "prosthodontics"],
  },
  {
    id: "wisdom-teeth", condition: "Wisdom Tooth Extraction", category: "Dental", severity: "moderate",
    description: "Third molar extraction recovery per AAOMS guidelines. Covers socket healing, dry socket prevention, diet progression, jaw stiffness, and complication monitoring.",
    questions: ["How many days has it been since your wisdom teeth were removed?", "Rate your pain level — is it improving each day or staying the same?", "Are you taking your prescribed pain medication on schedule?", "Are you biting on the gauze pads as instructed to control bleeding?", "Have you noticed any bad smell or taste from the extraction site (possible dry socket)?", "Are you eating soft foods and avoiding straws, which can cause dry socket?", "Are you applying ice packs for the first 48 hours and then warm compresses?", "Do you have any fever, excessive swelling, or difficulty opening your mouth?", "Are you gently rinsing with warm salt water starting 24 hours after surgery?", "When is your follow-up appointment to check the healing sites?", lastQ],
    specialties: ["oral-surgery"],
  },

  // ── Prosthodontics ────────────────────────────────────────────────
  {
    id: "cosmetic-dental", condition: "Cosmetic Dentistry Consultation", category: "Dental", severity: "low",
    description: "Esthetic dental evaluation per AACD standards. Addresses patient concerns about tooth color, shape, alignment, and gaps. Treatment options include whitening, veneers, bonding, and orthodontics.",
    questions: ["What concerns do you have about your smile that you'd like to address?", "Are you considering teeth whitening, and have you tried over-the-counter products?", "Are you interested in veneers, bonding, or crowns to improve your smile?", "Have you had previous cosmetic dental treatment? If so, what?", "Are you happy with the shape, size, and color of your teeth?", "Do you have gaps, chips, or uneven teeth that bother you?", "Are your teeth stained or discolored from food, drinks, or smoking?", "Do you have any crowns, fillings, or restorations that need replacement?", "Do you experience any dental anxiety or sensitivity with treatment?", "What budget range are you considering for cosmetic treatment?", lastQ],
    specialties: ["prosthodontics"],
  },
  {
    id: "crown-bridge", condition: "Crown / Bridge Fitting", category: "Dental", severity: "moderate",
    description: "Fixed prosthodontic restoration assessment per ACD guidelines. Covers crown/bridge fit, occlusion, margin integrity, cement washout, and long-term maintenance requirements.",
    questions: ["How does the crown or bridge feel — is your bite comfortable and even?", "Are you experiencing any sensitivity to hot, cold, or biting pressure under the new crown?", "Can you floss normally around the crown or bridge — does the floss pass through the contact?", "Does the crown or bridge feel too high when you bite down?", "Have you noticed any food impaction around the margins of the restoration?", "Is there any grey line or darkening at the gum line (for porcelain-fused-to-metal)?", "Are you avoiding chewing hard objects on the crowned tooth — ice, hard candy?", "How does the color and shape of the crown match your natural teeth?", "Do you have any concerns about the appearance, fit, or comfort?", "When is your follow-up to evaluate cementation and check for any issues?", lastQ],
    specialties: ["prosthodontics"],
  },
  {
    id: "dentures", condition: "Complete / Partial Dentures", category: "Dental", severity: "moderate",
    description: "Denture assessment and adjustment per ACD guidelines. Covers fit, retention, occlusion, sore spots, chewing efficiency, and need for relining or rebasing over time.",
    questions: ["How do your dentures fit — are they stable and comfortable, or loose?", "Are you experiencing any sore spots, irritation, or pressure areas on your gums?", "Are you able to chew a variety of foods with your dentures?", "Do your dentules stay in place when you talk, laugh, or cough?", "Are you using denture adhesive — and if so, how much and how often?", "Do you remove your dentures at night to let your gums rest?", "Are you cleaning your dentures daily with a denture brush and cleanser?", "Have you noticed any changes in how your dentures fit — looseness may indicate bone resorption?", "Are you rinsing your mouth and cleaning your gums, tongue, and palate daily?", "When was your last denture reline or adjustment — are you due for one?", lastQ],
    specialties: ["prosthodontics"],
  },

  // ── Pediatric Dentistry ───────────────────────────────────────────
  {
    id: "pediatric-dental", condition: "Pediatric Dental Check", category: "Dental", severity: "low",
    description: "Pediatric oral health per AAPD guidelines. First dental visit by age 1. Focuses on caries risk assessment, fluoride varnish, anticipatory guidance, and establishing a dental home.",
    questions: ["How old is your child?", "Is your child brushing with a fluoride toothpaste and parental supervision?", "Has your child complained of any tooth pain or sensitivity?", "Have you noticed any cavities, white spots, or discoloration on the teeth?", "Is your child eating and drinking normally?", "Has your child had any falls or mouth injuries?", "Does your child use a pacifier, thumb-suck, or bottle at bedtime?", "Have you started flossing your child's teeth?", "When was the last dental visit and were any X-rays taken?", "Are you applying fluoride varnish or using fluoridated water?", lastQ],
    specialties: ["pediatric-dentistry"],
  },
  {
    id: "child-dental-trauma", condition: "Child Dental Trauma", category: "Dental", severity: "high",
    description: "Pediatric dental trauma management per AAPD/IAAD guidelines. Covers avulsion, subluxation, fracture (Ellis classification), and luxation injuries. Timely reimplantation is critical for avulsed permanent teeth.",
    questions: ["What happened — did your child fall, get hit, or injure their mouth?", "Which tooth or teeth are affected — primary (baby) or permanent (adult)?", "Is the tooth completely knocked out (avulsed), pushed back, loose, or broken?", "If the tooth was knocked out, do you have it and have you kept it moist (in milk or saliva)?", "Is there bleeding from the mouth, lip, or gums?", "Can your child bite down normally or is there pain with contact?", "Has your child had a tetanus shot if the injury involved a dirty surface?", "Are there any signs of concussion — headache, dizziness, nausea, or memory loss?", "Has your child taken any pain medication — and what is appropriate for their age?", "Can you get to a dentist or emergency room within the next hour for urgent treatment?", lastQ],
    specialties: ["pediatric-dentistry", "general-dentistry"],
  },
  {
    id: "child-cavity", condition: "Pediatric Cavity Treatment", category: "Dental", severity: "moderate",
    description: "Pediatric caries management per AAPD guidelines. Covers cavity extent (ICDAS), behavior management techniques, stainless steel crowns, fluoride varnish, and caries risk reduction strategies.",
    questions: ["Which tooth has the cavity and how did the dentist describe its size?", "Is your child experiencing any pain, sensitivity, or swelling from the cavity?", "What type of filling or restoration was placed — composite, amalgam, or stainless steel crown?", "Is your child able to eat normally without pain after the cavity treatment?", "Are you helping your child brush twice daily with fluoride toothpaste?", "How many cavities has your child had — is their caries risk high?", "Are you limiting sugary snacks, juices, and sticky foods between meals?", "Does your child have dental anxiety — and what behavior management was used?", "Are you applying fluoride varnish at each dental visit as recommended?", "Have you considered dental sealants for your child's permanent molars?", lastQ],
    specialties: ["pediatric-dentistry"],
  },
];
