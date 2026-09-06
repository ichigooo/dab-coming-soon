window.DAB_STORE = Object.freeze({
  enabled: true,
  // Charcoal is the black filament used in every available colorway.
  allowedAccentColors(bodyColor, colors) {
    return colors.filter((color) => (bodyColor === "Charcoal") !== (color === "Charcoal"));
  },
  product: Object.freeze({
    name: "Dab Block",
    price: "",
    shipping: "$5.95 flat-rate shipping.",
    returns: "Easy returns if it’s not the right fit.",
    variants: Object.freeze([
      Object.freeze({
        id: "hold-type-01",
        name: "DAB BLOCK 02",
        description: "Uneven Edge Block",
        details: Object.freeze([
          "A 3D-printed no-hang training block designed around the natural shape of your hand. Built for more natural finger positioning, BLOCK 02 uses an ergonomic, variable-height edge profile that follows the differences in length between your fingers.",
          "On a traditional flat edge, your middle and ring fingers often have to flex more deeply so the shorter index and pinky can reach the same surface. BLOCK 02 changes the height of each finger position, allowing the hand to settle into a more natural half-crimp position with more even engagement across all four fingers.",
          "The result is a comfortable, high-friction edge designed for no-hang training, weighted pulls, warm-ups, and general finger-strength work. By spreading the load more evenly across the hand, the ergonomic profile can reduce the tendency for the longer middle and ring fingers to take a disproportionate share of the load."
        ]),
        comparison: Object.freeze({
          title: "BLOCK 02 — Ergonomic Edge vs. BLOCK 01 — Flat Edge",
          paragraphs: Object.freeze([
            "Neither profile replaces the other—they serve different training goals.",
            "For general finger strength, the ergonomic edge allows the fingers to work from a more natural position and helps distribute loading across the hand. It can also be useful when you intentionally want to reduce load on one finger or place more emphasis on weaker outer fingers during controlled training.",
            "For hold-specific training, a traditional flat edge remains the better choice. If your goal is to become stronger and more coordinated on the small, flat crimps you encounter on the wall or outdoors, training on a flat edge gives you greater specificity.",
            "Think of BLOCK 02 as the option for ergonomic strength training and balanced loading, while BLOCK 01 provides the familiar feel and specificity of a traditional flat edge."
          ])
        }),
        price: "$30.00",
        galleryAspectRatio: "5671 / 3527",
        modelUrl: "/assets/models/dab-block-02.preview.3mf?v=20260904-1",
        checkoutUrl: "https://checkout.dabclimbing.com/b/7sY3cx40RdkR3sCbYZ4wM02",
        edgeDepths: Object.freeze([12, 15, 18, 20, 22, 25]),
        defaultEdgeDepths: Object.freeze([22]),
        edgeDepthCount: 1,
        bodyColors: Object.freeze(["Clay Pink", "Lavender", "Soft Lemon", "Charcoal"]),
        accentColors: Object.freeze(["Clay Pink", "Lavender", "Soft Lemon", "Charcoal"]),
        defaultBodyColor: "Clay Pink",
        defaultAccentColor: "Charcoal",
        colorPhotos: Object.freeze([
          Object.freeze({
            bodyColor: "Clay Pink", accentColor: "Charcoal",
            src: "/assets/images/dab-block-02-clay-pink-charcoal.jpeg",
            alt: "Clay Pink and Charcoal Dab Block 02 on chalk-dusted rock beside climbing gear"
          }),
          Object.freeze({
            bodyColor: "Lavender", accentColor: "Charcoal",
            src: "/assets/images/dab-block-02-lavender-charcoal.jpeg",
            alt: "Lavender and Charcoal Dab Block 02 hanging in a climbing gym"
          }),
          Object.freeze({
            bodyColor: "Soft Lemon", accentColor: "Charcoal",
            src: "/assets/images/dab-block-02-lemon-charcoal.png",
            alt: "Back of a Soft Lemon and Charcoal Dab Block 02 resting on rock"
          }),
          Object.freeze({
            bodyColor: "Charcoal", accentColor: "Lavender",
            src: "/assets/images/dab-block-02-charcoal-lavender.jpeg",
            alt: "Charcoal and Lavender Dab Block 02 resting on a crash pad"
          })
        ]),
        photos: Object.freeze([
          Object.freeze({
            src: "/assets/images/dab-block-02-studio.png",
            alt: "Soft Lemon and Charcoal Dab Block 02 hanging from black cord against a gray background"
          }),
          Object.freeze({
            src: "/assets/images/dab-block-02-in-use.jpeg",
            alt: "Climber using a Clay Pink and Charcoal Dab Block 02 outdoors"
          }),
          Object.freeze({
            colorFallback: true,
            src: "/assets/images/dab-block-02-color-lineup.png",
            alt: "Clay Pink, Soft Lemon, and Lavender Dab Block 02 colorways on rock"
          }),
          Object.freeze({
            src: "/assets/images/dab-block-02-chalk.jpg",
            alt: "Clay Pink and Charcoal Dab Block 02 on a chalked gym floor"
          }),
          Object.freeze({
            src: "/assets/images/dab-block-02-lineup.jpg",
            alt: "Dab Block 02 colorways arranged together"
          })
        ])
      }),
      Object.freeze({
        id: "hold-type-02",
        name: "DAB BLOCK 01",
        storyPhoto: Object.freeze({
          src: "/assets/images/dab-block-01-climbing.jpeg",
          alt: "Climber on an overhanging boulder above crash pads with mountains in the background"
        }),
        description: "Flat Edge Block",
        details: Object.freeze([
          "A compact 3D-printed no-hang training block built around the classic flat edge.",
          "Mix and match any two sizes to build the block around the way you train.",
          "BLOCK 01 is especially useful for hold-specific training and for climbers who want their off-the-wall finger training to more closely resemble the flat edges and crimps they encounter indoors and outside."
        ]),
        comparison: Object.freeze({
          title: "BLOCK 01 — Flat Edge vs. BLOCK 02 — Ergonomic Edge",
          paragraphs: Object.freeze([
            "Choose BLOCK 01 for the familiar feel of a straight, flat edge, especially when you want your training setup to resemble the crimps you climb indoors and outside.",
            "Choose BLOCK 02 if you prefer a variable-height edge profile that follows the differences in length between your fingers.",
            "For BLOCK 01, pick two edge depths from 12, 15, 18, 20, 22, and 25 mm. Pair a deeper edge with a shallower one for two different feels, or choose matching depths if you prefer the same edge on both sides. The default pairing is 15 mm and 20 mm."
          ])
        }),
        price: "$25.00",
        galleryAspectRatio: "3 / 2",
        modelUrl: "/assets/models/dab-block-01.preview.3mf?v=20260904-1",
        checkoutUrl: "https://checkout.dabclimbing.com/b/6oU5kF2WN3Khe7gaUV4wM03",
        edgeDepths: Object.freeze([12, 15, 18, 20, 22, 25]),
        defaultEdgeDepths: Object.freeze([15, 20]),
        edgeDepthCount: 2,
        bodyColors: Object.freeze(["Clay Pink", "Lavender", "Soft Lemon", "Charcoal"]),
        accentColors: Object.freeze(["Clay Pink", "Lavender", "Soft Lemon", "Charcoal"]),
        defaultBodyColor: "Clay Pink",
        defaultAccentColor: "Charcoal",
        colorPhotos: Object.freeze([
          Object.freeze({
            bodyColor: "Lavender", accentColor: "Charcoal",
            src: "/assets/images/dab-block-01-lavender-charcoal.jpeg",
            alt: "Lavender and Charcoal Dab Block 01 hanging from black cord with 15mm and 20mm edges",
            galleryPosition: 2
          }),
          Object.freeze({
            bodyColor: "Clay Pink", accentColor: "Charcoal",
            src: "/assets/images/dab-block-01-new.jpeg",
            alt: "Clay Pink and Charcoal Dab Block 01",
            galleryPosition: 3
          })
        ]),
        photos: Object.freeze([
          Object.freeze({
            src: "/assets/images/dab-block-01-main.jpg?v=20260904",
            alt: "Soft Lemon and Charcoal Dab Block 01 hanging from black cord in a studio product view"
          }),
          Object.freeze({
            src: "/assets/images/dab-block-01-front.jpg?v=20260818-2",
            alt: "Soft Lemon and Charcoal Dab Block 01 in a studio product view"
          }),
          Object.freeze({
            src: "/assets/images/dab-block-01-pack.jpg?v=20260818-2",
            alt: "Soft Lemon and Charcoal Dab Block 01 resting on rock"
          })
        ])
      })
    ])
  })
});
