// src/notes/PhysicsNotes.js
// Add chapter notes here — each key is the exact chapter name

const PhysicsNotes = {

  'Units and Measurements': {
    intro: 'The International System of Units',
    sections: [
      {
        title: 'Measurement and Units',
        content: "Measurement involves comparing a physical quantity with a reference standard called a unit. It's expressed as a number and a unit.",
      },
      {
        title: 'Fundamental and Derived Units',
        content: 'The fundamental or base units define other physical quantities. Derived units are combinations of base units.',
      },
      {
        title: 'System of Units',
        content: 'Coherent system combining both base and derived units is termed the system of units.',
        bullets: [
          'CGS: Centimeter, gram, and second.',
          'FPS: Foot, pound, and second.',
          'MKS: Metre, kilogram, and second.',
        ],
      },
      {
        title: 'The SI System',
        content: 'Internationally accepted system since 1971, defined by the Bureau International des Poids et Mesures. Seven base units form the foundation.',
      },
      {
        title: 'SI Base Units',
        bullets: [
          'Metre (m) for length',
          'Kilogram (kg) for mass',
          'Second (s) for time',
          'Ampere (A) for electric current',
          'Kelvin (K) for temperature',
          'Mole (mol) for the amount of substance',
          'Candela (cd) for luminous intensity',
        ],
      },
      {
        title: 'Defined Units for Angles',
        content: 'Both are dimensionless.',
        bullets: [
          'Plane Angle: Radian (rad)',
          'Solid Angle: Steradian (sr)',
        ],
      },
      {
        title: 'Significant Figures',
        content: 'Significant figures in a measurement include all reliably known digits plus the first uncertain digit.',
        bullets: [
          'Non-zero digits are always significant.',
          'Zeros between non-zero digits are significant.',
          'Numbers less than 1: Leading zeros are not significant.',
          'Trailing zeros without a decimal point are not significant.',
        ],
      },
      {
        title: 'Scientific Notation',
        content: 'Presenting numbers in scientific notation (a × 10ᵇ) helps eliminate ambiguity with significant figures. All digits in the base are significant.',
      },
      {
        title: 'Arithmetic Operations Rules',
        content: 'For multiplication/division, results retain the least number of significant figures from any operand. For addition/subtraction, results hold the least number of decimal places from any value.',
      },
      {
        title: 'Dimensions of Physical Quantities',
        content: 'The fundamental nature of every physical quantity is described by its dimensions. The seven base quantities are:',
        bullets: [
          'Length [L]', 'Mass [M]', 'Time [T]',
          'Electric Current [A]', 'Temperature [K]',
          'Luminous Intensity [cd]', 'Amount of Substance [mol]',
        ],
      },
      {
        title: 'Dimensional Formulae',
        bullets: [
          'Volume: [M⁰ L³ T⁰]',
          'Velocity: [M⁰ L T⁻¹]',
          'Acceleration: [M⁰ L T⁻²]',
          'Force: [M L T⁻²]',
          'Mass Density: [M L⁻³ T⁰]',
        ],
      },
      {
        title: 'Principle of Homogeneity',
        content: 'Physical quantities can be added or subtracted only if they are dimensionally homogeneous (e.g., velocity cannot add to force).',
      },
      {
        title: 'Limitations of Dimensional Analysis',
        content: "Dimensional analysis checks only dimensional validity. Correct dimensions don't always guarantee accurate equations.",
      },
      {
        title: 'Special Mathematical Functions',
        content: 'The arguments of functions like trigonometric, logarithmic, and exponential must be dimensionless.',
      },
      {
        title: 'Dimensionless Quantities',
        bullets: [
          'Ratios of similar quantities have no dimensions (e.g., angle = length/length).',
          'Refractive index: speed of light in vacuum / speed of light in medium.',
        ],
      },
      {
        title: 'The Dimensional Consistency Test',
        content: 'A successful test confirms consistency but not correctness; however, failing it indicates error.',
      },
    ],
  },

  'Motion in A Straight Line': {
    intro: 'Motion in One Dimension',
    sections: [
      {
        title: 'Position',
        content: 'Position of any point is completely expressed by two factors: its distance from the observer and its direction with respect to observer. Position is characterised by a vector known as position vector.\n\nFor point P with coordinates (x, y): r = xi + yj\nFor point P in space (x, y, z): r = xi + yj + zk',
      },
      {
        title: 'Displacement',
        content: 'Displacement is the change in position vector — a vector joining initial to final position.',
        bullets: [
          'Displacement is a vector quantity.',
          'Dimension: [M⁰L¹T⁰], Unit: metre (S.I.)',
          'Net displacement = vector sum of all individual displacements.',
        ],
      },
      {
        title: 'Comparison: Distance vs Displacement',
        bullets: [
          'Distance > Displacement (always).',
          'Distance can never be negative or zero for a moving particle; displacement can be zero or negative.',
          'For motion between two points, displacement is single valued; distance depends on actual path.',
          'Distance never decreases with time; displacement can decrease (body moving toward initial position).',
          'Magnitude of displacement equals distance only for straight-line motion without direction change.',
        ],
      },
      {
        title: 'Speed',
        content: 'Rate of distance covered with time. It is a scalar quantity.\nDimension: [M⁰L¹T⁻¹], Unit: m/s (S.I.)',
        bullets: [
          'Uniform speed: equal distances in equal time intervals.',
          'Non-uniform speed: unequal distances in equal time intervals.',
          'Average speed = Distance travelled / Time taken = Δs/Δt',
          'Instantaneous speed = lim(Δt→0) Δs/Δt = ds/dt',
        ],
      },
      {
        title: 'Average Speed — Special Cases',
        bullets: [
          'Time average: Vav = (v₁t₁ + v₂t₂ + …) / (t₁ + t₂ + …)',
          'If equal time halves at v₁ and v₂: Vav = (v₁ + v₂) / 2',
          'Distance average: Vav = (d₁ + d₂ + …) / (d₁/v₁ + d₂/v₂ + …)',
        ],
      },
      {
        title: 'Velocity',
        content: 'Rate of change of position i.e., rate of displacement with time. It is a vector quantity.\nDimension: [M⁰L¹T⁻¹], Unit: m/s (S.I.)',
        bullets: [
          'Uniform velocity: same magnitude and direction (straight line, no reversal).',
          'Non-uniform velocity: magnitude or direction or both change.',
          'Average velocity = Displacement / Time = Δr / Δt',
          'Instantaneous velocity = lim(t→0) Δr/Δt = dr/dt',
        ],
      },
      {
        title: 'Comparison: Speed vs Velocity',
        bullets: [
          'Instantaneous velocity is always tangential to the path.',
          'A particle may have constant speed but variable velocity.',
          'Magnitude of instantaneous velocity = instantaneous speed.',
          'For constant velocity, average = instantaneous velocity always.',
          'Average speed is scalar; average velocity is vector — same units (m/s).',
          'If body returns to start: average velocity = 0 but average speed > 0.',
        ],
      },
      {
        title: 'Acceleration',
        content: 'Time rate of change of velocity. Vector quantity — direction same as change in velocity.\nDimension: [M⁰L¹T⁻²], Unit: m/s² (S.I.)',
        table: {
          headers: ['Only direction changes', 'Only magnitude changes', 'Both change'],
          rows: [
            ['Acceleration ⊥ velocity', 'Acceleration ∥ or anti-∥ velocity', 'Two components: ⊥ and ∥'],
            ['e.g. Uniform circular motion', 'e.g. Motion under gravity', 'e.g. Projectile motion'],
          ],
        },
        bullets: [
          'Positive acceleration → velocity increasing with time.',
          'Zero acceleration → velocity uniform/constant.',
          'Negative acceleration (retardation) → velocity decreasing with time.',
          'Under gravity: a = g = 9.8 m/s² = 980 cm/s² = 32 ft/s²',
        ],
      },
      {
        title: 'Types of Acceleration',
        bullets: [
          'Uniform acceleration: constant magnitude and direction throughout motion.',
          'Non-uniform acceleration: magnitude or direction or both change.',
          'Average acceleration = Δv/Δt = (v₂ − v₁)/Δt',
          'Instantaneous acceleration = lim(Δt→0) Δv/Δt = dv/dt = d²x/dt²',
          'If velocity is function of position: a = v × dv/dx',
          'Average for two intervals: aav = (a₁t₁ + a₂t₂)/(t₁ + t₂)',
        ],
      },
      {
        title: 'Position-Time Graph — Interpretations',
        content: 'The slope (tanθ) of position-time graph at any point gives the velocity of the particle.',
        images: ['pt1_rest','pt2_infinite','pt3_uniform','pt4_accel','pt5_retard'],
        imageLabels: [
          'θ=0°: Particle at rest (v=0)',
          'θ=90°: Infinite velocity (not possible)',
          'θ=constant: Uniform velocity (a=0)',
          'θ increasing: Acceleration (a>0)',
          'θ decreasing: Retardation (a<0)',
        ],
        bullets: [
          'θ = 0° — horizontal line: particle at rest, v = 0.',
          'θ = 90° — vertical line: infinite velocity — not physically possible.',
          'θ = constant — straight diagonal: uniform velocity, a = 0.',
          'θ increasing — curve bending up: velocity increasing, a > 0.',
          'θ decreasing — curve bending down: velocity decreasing, a < 0.',
          'θ constant but > 90°: negative velocity (moving toward origin).',
          'Graph crossing itself: particle at two positions simultaneously — impossible.',
          'For two particles: v₁/v₂ = tanθ₁ / tanθ₂',
        ],
      },
      {
        title: 'Velocity-Time Graph — Interpretations',
        content: 'Slope of v-t graph = acceleration. Area between graph and time axis = displacement.',
        images: ['vt1_infinite','vt2_uniform_accel','vt3_incr_accel','vt4_pos_accel_neg_v','vt5_pos_accel_pos_v','vt6_neg_accel_pos_v','vt7_neg_accel_zero_v'],
        imageLabels: [
          'θ=90°: Infinite accel (not possible)',
          'Constant slope: Uniform acceleration',
          'Increasing slope: Increasing acceleration',
          'Positive accel, negative initial v',
          'Positive accel, positive initial v',
          'Negative accel, positive initial v',
          'Negative accel, zero initial v',
        ],
        bullets: [
          'Total distance = sum of |areas|: s = ∫|v|dt',
          'Total displacement = sum of signed areas: r = ∫v dt',
          'θ = 0° horizontal: constant velocity, a = 0.',
          'θ = constant < 90°: uniform positive acceleration.',
          'θ = constant > 90°: uniform negative acceleration (retardation).',
          'θ increasing (bending toward v-axis): increasing acceleration.',
          'θ decreasing (bending toward t-axis): decreasing acceleration.',
        ],
      },
      {
        title: 'Equations of Kinematics (Uniform Acceleration)',
        content: 'u = initial velocity, v = final velocity, a = acceleration, s = distance in time t, sₙ = distance in nth second.\n\nAcceleration is constant when both magnitude and direction remain constant.',
        table: {
          headers: ['Scalar Form', 'Vector Form'],
          rows: [
            ['v = u + at',           'v⃗ = u⃗ + at⃗'],
            ['s = ut + ½at²',        's⃗ = ut⃗ + ½at²'],
            ['v² = u² + 2as',        'v⃗·v⃗ − u⃗·u⃗ = 2a⃗·s⃗'],
            ['s = (u + v)/2 × t',    's⃗ = ½(u⃗ + v⃗)t'],
            ['sₙ = u + a/2(2n − 1)', 'sₙ⃗ = u⃗ + a⃗/2(2n − 1)'],
          ],
        },
      },
      {
        title: 'Key Results for Uniform Acceleration',
        bullets: [
          'Distance in t seconds ∝ t² — ratio 1 : 4 : 9 for t = 1, 2, 3 s.',
          'Distance in nth second ∝ (2n−1) — ratio 1 : 3 : 5 for n = 1, 2, 3.',
          'If velocity is nu and same braking force: stopping distance = n²s.',
        ],
      },
      {
        title: 'Free Fall (Motion Under Gravity)',
        content: 'Acceleration due to gravity g acts downward. All bodies fall with same acceleration in absence of air resistance.',
        bullets: [
          'g ≈ 9.8 m/s² = 980 cm/s² = 32 ft/s²',
          'All bodies fall with same acceleration regardless of mass.',
          'For upward throw: a = −g, v = 0 at max height.',
          'Time to reach max height = u/g.',
          'Max height = u²/2g.',
        ],
      },
    ],
  },

  'Motion in A Plane': {
    intro: 'Scalars and Vectors quantities',
    sections: [
      { title: 'Vectors and Motion Description', content: 'In two or three dimensions, vectors are needed to describe physical quantities like velocity and acceleration.' },
      { title: 'Classifying Quantities', content: 'Physical quantities are classified as scalars and vectors. Scalars have only magnitude, while vectors have both magnitude and direction.' },
      { title: 'Scalar Examples', content: 'Examples of scalars include:', bullets: ['Distance', 'Mass', 'Temperature', 'Time'] },
      { title: 'Vector Examples', content: 'Examples of vectors are:', bullets: ['Displacement', 'Velocity', 'Acceleration', 'Force'] },
      { title: 'Representing Vectors', content: 'Vectors are represented using bold font in text. If writing by hand, an arrow is placed over the letter. Example: v can be written as $\\vec{v}$.' },
      { title: 'Position and Displacement Vectors', content: 'Position vectors describe the location of an object in a plane. Displacement vectors describe the change in position and do not depend on the actual path traveled.' },
      { title: 'Understanding Displacement', content: 'The displacement vector joins the initial and final positions. It is a straight line, regardless of the actual path taken.' },
      { title: 'Scalar Operations', content: 'Scalars can be combined using the rules of ordinary algebra:', bullets: ['Added', 'Subtracted', 'Multiplied', 'Divided'] },
      { title: 'Vector Addition', content: 'Vectors are added using the triangle or parallelogram law of addition, requiring consideration of direction and magnitude.' },
      { title: 'Uniform Circular Motion', content: 'Uniform circular motion is a case of motion with consistent speed along a circular path, often observed in daily life scenarios.' },
      { title: 'Vectors and Scalars', content: 'Physics divides quantities into vectors and scalars based on their attributes. Vectors possess both magnitude and direction, such as displacement and force. Scalars, such as mass and time, possess only magnitude.' },
      { title: 'Representation of Vectors', content: 'Vectors are visualized using directed line segments. The length represents magnitude, while the arrowhead indicates direction. They are often depicted with bold letters like $A, B$ or with an arrow over the letter, e.g., $\\vec{A}$.' },
      { title: 'Magnitude of Vectors', content: 'The magnitude of a vector $\\vec{A}$ is shown as $|A|$ or simply A. It represents the vector\'s size without incorporating its direction.' },
      { title: 'Example of Displacement Vector', content: 'If a car moves 50 km east, its displacement vector $\\vec{A}$ is directed east with a magnitude of 50 km.' },
      { title: 'Types of Vectors', bullets: [
        'Unit Vectors: Have a unit magnitude, indicating direction. Denoted by $\\hat{i}, \\hat{j},$ and $\\hat{k}$ along the x, y, and z axes.',
        'Zero Vectors: Possess zero magnitude and lack direction.',
        'Equal Vectors: Share the same magnitude and direction, regardless of position.',
        'Negative Vectors: Maintain the same magnitude but have opposite direction to the original vector.',
      ]},
      { title: 'Mathematical Representation', content: 'Vectors in three-dimensional space are represented as: $$\\vec{A} = A_x\\hat{i} + A_y\\hat{j} + A_z\\hat{k}$$ Here, $A_x, A_y,$ and $A_z$ are components along the x, y, and z axes.' },
      { title: 'Vector Operations', content: 'Components of vectors facilitate operations like vector addition, subtraction, dot product, and cross product.' },
      { title: 'Importance of Vectors in Physics', content: 'Vectors are crucial in understanding motion, forces, and fields, providing a structured approach to analyze these phenomena.' },
      { title: 'Vectors in Mechanics', content: 'Vectors are fundamental tools in mechanics for analyzing forces, torques, and motion vectors.' },
      { title: 'Vectors in Electromagnetism', content: 'In electromagnetism, vectors are used to represent fields, directions of field lines, and interactions between charges.' },
      { title: 'Definition of Equal Vectors', content: 'Two vectors are considered equal if they share the same magnitude and direction.' },
      { title: 'Visual Representation of Equal Vectors', content: 'Figure 3.2(a) demonstrates equal vectors, A and B, where A = B is valid, as both their magnitude and direction are identical.' },
      { title: 'Condition for Vector Equality', content: 'Vectors are equal when:', bullets: ['They have the same magnitude.', 'They are oriented in the same direction.'] },
      { title: 'Checking Equality in Practice', content: 'To verify equality:', bullets: ['Shift B parallel to itself until tails coincide with A.', 'If tips also coincide thereafter, vectors are deemed equal.'] },
      { title: 'Non-Equal Vectors with Same Magnitude', content: "Figure 3.2(b) illustrates vectors A' and B' which, despite possessing identical magnitude, diverge in direction and thus, are not equal." },
      { title: 'Free Vectors', content: 'Free vectors remain unchanged when displaced parallel to their initial direction because they do not have fixed locations.' },
      { title: 'Localized Vectors', content: 'When the position or line of application is crucial, vectors are termed localized vectors, as seen in various physical applications.' },
      { title: 'Shifting Vectors', content: 'While comparing vectors, they can be shifted parallel to themselves without altering their properties.' },
      { title: 'Concept of Vector Multiplication', content: 'Multiplying a vector with a positive number changes its magnitude but keeps the direction unchanged.' },
      { title: 'Positive Scalar Multiplication', content: 'When a positive scalar multiplies a vector, the direction remains unchanged, but the magnitude scales by the scalar value.' },
      { title: 'Negative Scalar Multiplication', content: 'Multiplication by a negative scalar reverses the direction of the vector while scaling the magnitude by the absolute value of the scalar.' },
      { title: 'Example of Positive Scalar Multiplication', content: 'Multiplying vector A by 2:', bullets: ['Direction remains same as vector A.', 'The magnitude is twice that of A.'] },
      { title: 'Example of Negative Scalar Multiplication', content: 'Multiplying vector A by -1 or -1.5:', bullets: ['Reverse direction of vector A.', 'The magnitude is altered by factor 1 or 1.5 respectively.'] },
      { title: 'Dimensionality When Multiplying Scalars', content: 'When a vector is multiplied by a scalar with its own dimension, the resulting vector assumes combined dimensions of both.' },
      { title: 'Scalar Multiplier is a Physical Dimension', content: "If \u03bb has a physical dimension, the resultant vector's dimensionality is a product of \u03bb's and the original vector's dimensions." },
      { title: 'Example of Vector Dimensionality Change', content: 'Multiplying velocity vector by time gives a displacement vector, showing a change in dimensionality.' },
      { title: 'Addition of Vectors: Graphical Method', content: 'Vectors can be added using the triangle law or the parallelogram law. To find the sum of two vectors A and B, place vector B at the head of vector A and join the tail of A to the head of B to find the resultant, R.' },
      { title: 'Head-to-Tail Method', content: 'In this method, vectors are arranged head to tail to form three sides of a triangle. This makes it easy to visually add vectors and find the resultant vector.' },
      { title: 'Commutative Property of Vector Addition', content: 'The addition of vectors is commutative, which means A + B = B + A. This property is demonstrated through arranging the vectors differently but reaching the same resultant.' },
      { title: 'Associative Property of Vector Addition', content: 'Vector addition also follows the associative property: (A + B) + C = A + (B + C).' },
      { title: 'Adding Opposite Vectors', content: 'The sum of two equal and opposite vectors, such as A and -A, results in a zero vector, which is a vector with no magnitude and no direction. This is also called a null vector.' },
      { title: 'Properties of the Zero Vector', bullets: ['A + 0 = A', '0 multiplied by any vector results in a zero vector.', 'A zero vector arises if the initial and final positions of motion coincide.'] },
      { title: 'Vector Subtraction', content: 'Subtraction is defined as adding the opposite: A - B is equivalent to A + (-B). This operation is shown by adding the opposite of vector B to vector A.' },
      { title: 'Parallelogram Method for Vector Addition', content: 'To add vectors using the parallelogram method, place their tails at a common origin, then draw lines parallel to the vectors from the heads to form a parallelogram. The diagonal from the origin to the opposite corner gives the resultant.' },
      { title: 'Equivalence of Methods', content: 'The parallelogram and triangle methods produce the same resultant vector when adding two vectors. They are visually different but mathematically equivalent procedures.' },
      { title: 'Resolution of Vectors', content: 'The process of expressing a vector as a sum of two or more component vectors is known as resolution of vectors.' },
      { title: 'Unit Vectors', content: 'Unit vectors are vectors of unit magnitude, used to specify a direction. They have no dimension or unit. Denoted as $\\hat{i}$ for x-axis, $\\hat{j}$ for y-axis, $\\hat{k}$ for z-axis.' },
      { title: 'Resolving Vectors with Unit Vectors', content: 'Vector A in the x-y plane can be resolved into components along unit vectors as: $$\\vec{A} = A_x\\hat{i} + A_y\\hat{j}$$ where $A_x = A\\cos\\theta$ and $A_y = A\\sin\\theta$.' },
      { title: 'Components of a Vector', content: 'A vector component can be positive, negative or zero depending on the value of angle \u03b8 it makes with the x-axis.' },
      { title: 'Magnitude of Vector', content: 'Magnitude of vector can be determined using: $$A = \\sqrt{A_x^2 + A_y^2}$$ for vectors resolved into the x-y plane.' },
      { title: 'Angle with Axis', content: 'Angle \u03b8 that a vector makes with the x-axis is given by: $$\\theta = \\tan^{-1}\\left(\\frac{A_y}{A_x}\\right)$$' },
      { title: 'Resolving Vectors in Three Dimensions', content: 'A vector can also be resolved into three components: $$A_x = A\\cos\\alpha, \\quad A_y = A\\cos\\beta, \\quad A_z = A\\cos\\gamma$$ where \u03b1, \u03b2, and \u03b3 are angles between A and the x-, y-, and z-axes respectively.' },
      { title: 'Definition of Unit Vector', content: 'A unit vector is a vector with a magnitude of one, used to indicate the direction of a vector without considering its length.' },
      { title: 'Determining a Unit Vector', content: 'The unit vector of vector $\\vec{A}$ is denoted as $\\hat{A}$ and is determined using: $$\\hat{A} = \\frac{\\vec{A}}{|\\vec{A}|}$$' },
      { title: 'Standard Unit Vectors in Cartesian Coordinates', bullets: ['$\\hat{i}$ for the x-axis.', '$\\hat{j}$ for the y-axis.', '$\\hat{k}$ for the z-axis.'] },
      { title: 'Expressing a Vector in 3D Space', content: 'A vector with components $A_x, A_y,$ and $A_z$ can be expressed as: $$\\vec{A} = A_x\\hat{i} + A_y\\hat{j} + A_z\\hat{k}$$' },
      { title: 'Introduction to Vector Addition (Analytical)', content: 'Vector addition can be performed graphically, but it\'s often more precise to use the analytical method by combining vector components.' },
      { title: 'Expression of Vectors', content: 'In the x-y plane, vectors A and B can be expressed as: $$A = A_x\\hat{i} + A_y\\hat{j}$$ $$B = B_x\\hat{i} + B_y\\hat{j}$$' },
      { title: 'Addition of Vectors (Analytical)', content: 'The sum of two vectors A and B is a resultant vector R: $$R = A + B = (A_x + B_x)\\hat{i} + (A_y + B_y)\\hat{j}$$' },
      { title: 'Vector Addition in 3D', content: 'In three dimensions: $$\\vec{R} = R_x\\hat{i} + R_y\\hat{j} + R_z\\hat{k}$$ where $R_x = A_x+B_x$, $R_y = A_y+B_y$, $R_z = A_z+B_z$.' },
      { title: 'Position Vector and Displacement', content: 'The position vector of a particle in an x-y reference frame is represented as $r = x\\hat{i} + y\\hat{j}$. Displacement: $\\Delta r = r\' - r = \\hat{i}\\Delta x + \\hat{j}\\Delta y$.' },
      { title: 'Average Velocity', content: 'Average velocity is defined as the displacement per unit time: $$\\bar{v} = \\frac{\\Delta r}{\\Delta t} = \\hat{i}\\frac{\\Delta x}{\\Delta t} + \\hat{j}\\frac{\\Delta y}{\\Delta t}$$' },
      { title: 'Instantaneous Velocity', content: 'Instantaneous velocity is the limit of the average velocity as the time interval approaches zero: $$v = \\lim_{\\Delta t \\to 0}\\frac{\\Delta r}{\\Delta t} = \\frac{dr}{dt}$$ The direction is tangent to the path at any point in motion.' },
      { title: 'Magnitude and Direction of Velocity', content: 'The magnitude of velocity v is: $$v = \\sqrt{v_x^2 + v_y^2}$$ The direction is given by angle \u03b8, where $\\tan\\theta = v_y/v_x$.' },
      { title: 'Average Acceleration', content: 'Average acceleration is the change in velocity divided by time: $$\\bar{a} = \\frac{\\Delta v}{\\Delta t} = a_x\\hat{i} + a_y\\hat{j}$$' },
      { title: 'Instantaneous Acceleration', content: 'Instantaneous acceleration is the limit of average acceleration as time intervals approach zero: $$a = \\lim_{\\Delta t \\to 0}\\frac{\\Delta v}{\\Delta t}$$' },
      { title: 'Acceleration Components', content: 'The acceleration components are defined as $a_x = d^2x/dt^2$ and $a_y = d^2y/dt^2$. The overall acceleration can be expressed as $a = a_x\\hat{i} + a_y\\hat{j}$.' },
      { title: 'Directional Relationship Between Velocity and Acceleration', content: 'For two-dimensional motion, velocity and acceleration can form any angle between 0\u00b0 and 180\u00b0. In contrast, one-dimensional motion dictates that they are either aligned or oppositely directed.' },
      { title: 'Motion in a Plane with Constant Acceleration', content: 'Acceleration remains constant when an object moves in the x-y plane. The equations of motion are: $$v = v_0 + at$$ $$r = r_0 + v_0 t + \\frac{1}{2}at^2$$ In component form: $v_x = v_{ox} + a_x t$, $v_y = v_{oy} + a_y t$.' },
      { title: 'Component Form of Position Equation', content: 'Position component equations: $$x = x_0 + v_{ox}t + \\frac{1}{2}a_x t^2$$ $$y = y_0 + v_{oy}t + \\frac{1}{2}a_y t^2$$' },
      { title: 'Independence in Directions', content: 'Motions in x and y directions are independent in a plane, allowing treatment as simultaneous one-dimensional motions with constant acceleration.' },
      { title: 'Projectile Explanation', content: 'A projectile is an object in motion after being projected or thrown, such as a football or baseball. Projectile motion results from two components: horizontal motion without acceleration and vertical motion with constant gravitational acceleration.' },
      { title: "Galileo's Contribution", content: 'Galileo stated the independence of horizontal and vertical components in projectile motion in his 1632 work, "Dialogue on the Great World Systems."' },
      { title: 'Velocity Components (Projectile)', content: 'Initial velocity components: $$V_{ox} = V_o\\cos\\theta_o \\text{ (Horizontal)}$$ $$V_{oy} = V_o\\sin\\theta_o \\text{ (Vertical)}$$' },
      { title: 'Time of Flight', content: 'Time taken for projectile motion: $$t_m = \\frac{v_o\\sin\\theta_o}{g}$$ Total flight time: $T_f = 2t_m$' },
      { title: 'Maximum Height', content: 'Maximum height reached is given by: $$h_m = \\frac{(v_o\\sin\\theta_o)^2}{2g}$$' },
      { title: 'Horizontal Range', content: 'The horizontal range of a projectile is given by: $$R = \\frac{v_0^2\\sin 2\\theta_0}{g}$$ Maximum range occurs when $\\theta_0 = 45°$.' },
      { title: 'Path of Motion', content: 'The trajectory of a projectile is a parabola, represented by: $$y = (\\tan\\theta_0)x - \\frac{g}{2(v_0\\cos\\theta_0)^2}x^2$$' },
      { title: 'Uniform Circular Motion', content: 'An object moves in a circle at a constant speed. The speed remains uniform, but the direction continuously changes, resulting in acceleration.', bullets: ['Velocity is tangent to the path and changes direction but not magnitude.', 'Acceleration is directed towards the center of the circle.'] },
      { title: 'Acceleration in Uniform Circular Motion', content: 'Given as centripetal acceleration directed towards the circle\'s center: $$a_c = \\frac{v^2}{R}$$' },
      { title: 'Angular Speed', content: 'Angular speed ($\\omega$) is the rate of change of angular displacement: $$\\omega = \\frac{\\Delta\\theta}{\\Delta t}$$' },
      { title: 'Linear and Angular Velocity Relationship', content: 'Linear velocity v related to angular speed by $v = R\\omega$. Velocity: $v = 2\\pi R\\nu$. Angular speed: $\\omega = 2\\pi\\nu$.' },
      { title: 'Centripetal Acceleration in Terms of Angular Speed', content: '$$a_c = \\omega^2 R$$ demonstrates how acceleration depends on angular speed. The acceleration remains constant in magnitude but changes direction.' },
      { title: 'Rectangular Components of a Vector', content: 'Vectors are broken down into components along the x, y, and z axes. Used to simplify problem analysis related to direction and magnitude.' },
      { title: 'Vector Components in 2D', content: 'A vector making an angle $\\theta$ with the x-axis is resolved. Two components: $A_x$ along x-axis and $A_y$ along y-axis.' },
      { title: 'Mathematical Representation in 2D', content: 'Formula for components: $A_x = A\\cos\\theta$, $A_y = A\\sin\\theta$. Original vector expression: $\\vec{A} = A_x\\hat{i} + A_y\\hat{j}$.' },
      { title: 'Vector Components in 3D', content: 'Vectors in 3D have three components: $A_x$, $A_y$, and $A_z$. Expression: $\\vec{A} = A_x\\hat{i} + A_y\\hat{j} + A_z\\hat{k}$.' },
      { title: 'Magnitude of a Vector', content: 'Calculated using: $$|\\vec{A}| = \\sqrt{A_x^2 + A_y^2 + A_z^2}$$ Represents the vector\'s size or extent.' },
      { title: 'Direction of a Vector', content: 'Direction cosines denote the angle with the coordinate axes. Useful for determining vector orientation.' },
      { title: 'Simplifying Vector Arithmetic', content: 'Rectangular components facilitate vector addition and subtraction. Components make such operations easier.' },
      { title: 'Resolving Forces and Motions', content: 'Allows breaking down complex forces into simpler parts. Focuses on each component independently before combining results.' },
      { title: 'Application of Vector Algebra', content: 'Instead of working with oblique vectors, focus on components. Combine results independently along each axis.' },
    ],
  },

  'Laws of Motion': {
    intro: "Aristotle's Fallacy",
    sections: [
      { title: 'Motion of a Particle', content: 'In previous chapters, motion was analyzed quantitatively. Uniform motion solely relies on velocity, while non-uniform motion requires understanding acceleration as well.' },
      { title: 'Basic Question of Motion', content: "What governs the motion of a body? Through examples such as kicking a football or the wind moving objects, it's evident that external forces are needed to start, stop, or change motion." },
      { title: 'Force and Contact', content: "While forces such as a kick or wind require contact, other forces such as gravitational or magnetic don't need contact to act on an object." },
      { title: 'Defining Force', content: 'External forces are pivotal both for initiating motion and stopping it. Gravity and magnetism exemplify distant action forces.' },
      { title: 'Uniform Motion Query', content: 'There was a historical debate on whether external force is needed to maintain uniform motion. This query was pivotal in establishing modern mechanics.' },
      { title: "Aristotle's Fallacy", content: "Aristotle suggested that external forces are always needed to maintain motion. He believed that external influences like air kept an arrow moving." },
      { title: 'Flawed View of Motion', content: "Aristotle's argument that ongoing external force is needed contradicts the reality where friction and opposing forces slow things down." },
      { title: 'Force Counteraction', content: 'Frictional forces like that between a moving car and the ground need to be countered with external force to maintain motion.' },
      { title: "Friction's Role", content: 'Friction and viscous forces create the illusion that continuous force is necessary to sustain motion when they oppose it.' },
      { title: "Galileo's Insight", content: "Galileo imagined a frictionless world where force wasn't needed to sustain motion, paving the way for a new understanding of mechanics." },
      { title: 'The Law of Inertia Explained', content: 'Galileo initiated the study of object motion on inclined planes, recognizing that objects tend to either accelerate when moving downhill or decelerate when moving upward.' },
      { title: 'Understanding Motion on Horizontal Planes', content: 'He concluded that objects moving on a frictionless horizontal plane should maintain a constant velocity, experiencing neither acceleration nor deceleration.' },
      { title: 'Experimentation with Double Inclined Planes', content: "Galileo's double inclined plane experiment showed that ideally, a ball will climb back to its original height on the opposite plane if friction is absent." },
      { title: 'Concept of Infinite Motion', content: 'Galileo determined that if the upward plane became horizontal, in the absence of friction, the ball would continue its motion indefinitely.' },
      { title: 'Real World Application', content: 'In practical situations, friction causes the ball to eventually stop, demonstrating the impact of opposing forces on motion.' },
      { title: 'Equivalence of Rest and Uniform Motion', content: "Galileo's insights contradicted earlier beliefs, showing that rest and uniform linear motion are equivalent states as no net force acts in either condition." },
      { title: 'Force and Uniform Motion', content: 'It is a misconception that a net force is required to maintain uniform motion. Instead, a counteracting external force is necessary to neutralize friction.' },
      { title: 'Inertia Defined', content: "Inertia is the property preventing a change in an object's state of rest or uniform motion without an external force." },
      { title: 'Maintaining Uniform Motion', content: 'To keep an object in uniform motion on a horizontal plane with friction, a force equal and opposite to friction must be applied.' },
      { title: 'Key Takeaways on Inertia', bullets: ['A body at rest remains at rest if no external force acts upon it.', 'A body in uniform motion continues its motion unless acted upon by an external force to change its state.'] },
      { title: "Newton's First Law of Motion", content: "Galileo initiated a shift from Aristotelian mechanics with his ideas on inertia, setting the stage for Newton's laws of motion." },
      { title: 'Definition of the First Law', content: "Newton's first law states: Every body continues in its state of rest or uniform motion in a straight line unless acted upon by an external force." },
      { title: 'Concept of Zero Acceleration', content: "If the net external force on a body is zero, then the body's acceleration is zero." },
      { title: 'Implications of the First Law', content: 'If a spaceship is far from external forces, its acceleration must be zero, moving with constant velocity.' },
      { title: 'Unknown Forces and Inertia', content: 'For terrestrial objects, even when in rest or uniform motion, forces like gravity and friction may cancel out.' },
      { title: 'Example of a Book on a Table', content: 'A book remains at rest due to the normal force (R) from the table balancing the gravitational force (W).' },
      { title: 'Incorrect Reasoning', content: 'It is incorrect to say the book is at rest because forces cancel; rather, net external force must be zero.' },
      { title: 'Car Movement and Friction', content: 'During acceleration, a car is acted upon by external forces like friction to increase speed.' },
      { title: 'Inertia and Body Movement', content: 'Inertia is observed when sudden movements challenge the state of rest, as in a starting or stopping bus.' },
      { title: 'Muscular Forces in Motion', content: 'During sudden bus movements, relative motion occurs due to inertia before muscular forces restore equilibrium.' },
      { title: 'Origin of External Force', content: "External force on a body arises due to interaction with another body. It's not inherent to the body itself." },
      { title: 'Force Pairs', content: 'Every force is a result of a mutual interaction between two bodies, occurring in equal and opposite pairs.' },
      { title: 'Example: Contact Forces', content: 'When a spring is compressed by a hand, the spring exerts an equal and opposite force on the hand.' },
      { title: 'Example: Non-Contact Forces', content: 'Gravity is an example of non-contact force. A stone exerts force on Earth as Earth exerts force on the stone due to gravity.' },
      { title: "Newton's Third Law", content: 'To every action, there is always an equal and opposite reaction. Forces are equal and opposite in nature.' },
      { title: 'Meaning of Action and Reaction', content: 'Action and reaction are simply forces. They occur simultaneously and neither is the cause of the other.' },
      { title: 'Instantaneous Force Application', content: "Action and reaction forces act at the same instant, meaning there's no sequence or causation between them." },
      { title: 'Different Bodies', content: 'Action and reaction forces act on different bodies, not on the same one. This is crucial in understanding motion.' },
      { title: 'Internal Forces in Systems', content: "In a system, internal forces cancel out, resulting in a net internal force of zero, allowing the application of Newton's Second Law." },
      { title: 'Law of Conservation of Momentum', content: 'The total momentum in an isolated system remains constant if external forces are absent. Individual particle momentum may change but cancels out overall.' },
      { title: 'Third Law of Motion Application', content: 'When a gun fires a bullet, the force on each object is equal and opposite. The momentum of the bullet equals the negative momentum of the gun, resulting in a total momentum of zero.' },
      { title: 'Concepts of Collisions', content: 'Collisions highlight the conservation of momentum. Objects involved experience changes in momentum but the total system momentum remains unchanged.' },
      { title: 'Second Law of Motion Application', content: 'The change in momentum for an object is equal to the force applied times the duration of the force. This principle applies in momentum conservation.' },
      { title: 'Elastic vs Inelastic Collisions', bullets: ['In an elastic collision: Both momentum and kinetic energy are conserved.', 'In an inelastic collision: Momentum is conserved, but kinetic energy is not.'] },
      { title: 'Isolated Systems', content: 'Isolated systems have no external influences, ensuring that internal interactions conserve overall momentum.' },
      { title: 'Example of Isolated System', content: 'A standalone bullet-gun system maintains total momentum, unaffected by outside forces.' },
      { title: 'Equal and Opposite Forces', content: 'Mutual forces between particles in a system are equal in magnitude and opposite in direction, resulting in momentum conservation.' },
      { title: 'Time Interval in Momentum Equation', content: 'The forces during a collision or interaction act over a set time interval, changing momentum but without affecting the total conserved momentum.' },
      { title: 'Recoil Effect Explained', content: 'The recoil observed when firing occurs due to equal and opposite force, demonstrating the momentum conservation within the system.' },
      { title: 'Equilibrium Definition', content: 'Equilibrium of a particle in mechanics occurs when the net external force is zero. This implies the particle is either at rest or in uniform motion.' },
      { title: 'Translational vs Rotational Equilibrium', content: 'Equilibrium for a body involves both translational (zero net external force) and rotational equilibrium (zero net external torque).' },
      { title: 'Two-Force Equilibrium', content: 'For equilibrium under two forces $F_1$ and $F_2$: The forces must be equal and opposite. $$F_1 = -F_2$$' },
      { title: 'Three-Force Equilibrium', content: 'For equilibrium with three concurrent forces $F_1, F_2$, and $F_3$: The vector sum of the forces must be zero. $$F_1 + F_2 + F_3 = 0$$' },
      { title: 'Parallelogram Law of Forces', content: 'The resultant of any two forces using the parallelogram law must be equal and opposite to the third force $F_3$.' },
      { title: 'Graphical Representation', content: 'Three forces in equilibrium can form a triangle with vector arrows taken in the same direction.' },
      { title: 'Generalizing Force Equilibrium', content: 'Equilibrium applies to forces such that they form a closed n-sided polygon with arrows in a consistent direction.' },
      { title: 'Equation (4.11) Explanation', content: 'The sum of forces in individual x, y, and z axis must each total to zero:', bullets: ['$F_{1x} + F_{2x} + F_{3x} = 0$', '$F_{1y} + F_{2y} + F_{3y} = 0$', '$F_{1z} + F_{2z} + F_{3z} = 0$'] },
      { title: 'Force Components', content: 'Each force has components along three directions: x, y, and z. For equilibrium, their components along each axis must cancel out to zero.' },
      { title: 'N-Sided Polygon Representation', content: 'A particle is in equilibrium under multiple forces if represented by the sides of a closed polygon with coherent arrow directions.' },
      { title: 'Gravitational Force', content: 'Gravitational force is a pervasive force that affects every object on Earth and governs celestial motions. It acts at a distance, without needing a medium.' },
      { title: 'Contact Forces', content: 'Contact forces arise when bodies are in direct contact, either solid or fluid. They include normal reaction and friction as key examples.' },
      { title: 'Normal Reaction and Friction', bullets: ['Normal Reaction: Force component perpendicular to the surfaces in contact.', 'Friction: Force component parallel to surfaces, opposing motion.'] },
      { title: 'Buoyant and Viscous Forces', bullets: ['Buoyant Force: The upward force on a solid in a fluid equal to the weight of displaced fluid.', 'Viscous Force: Resistance experienced by objects moving through a fluid.'] },
      { title: 'Tension and Spring Forces', bullets: ['Tension: Force developed in a stretched string.', 'Spring Force: Restoring force in a compressed or stretched spring, $F = -kx$.'] },
      { title: 'Electrical Forces and Contact Forces', content: 'Contact forces in mechanics are fundamentally due to electrical interactions between microscopic charged particles.' },
      { title: 'Static Friction', content: 'Static friction prevents motion onset. It matches applied forces up to a maximum limit based on the coefficient of static friction $\\mu_s$.' },
      { title: 'Kinetic Friction', content: 'Kinetic friction opposes relative motion between surfaces. It is less than maximum static friction and described by $f_k = \\mu_k N$.' },
      { title: 'Rolling Friction', content: 'During rolling, minimal friction occurs due to surface deformation, requiring less force than sliding friction.' },
      { title: 'Reducing Friction', bullets: ['Ball Bearings: Reduce friction in machinery.', 'Lubricants: Decrease power dissipation.', 'Rolling elements reduce impact of friction significantly.'] },
      { title: 'Definition of Circular Motion', content: 'Acceleration in circular motion is given by $V^2/R$, directed towards the center. The force providing this acceleration is the centripetal force.' },
      { title: 'Centripetal Force for Different Scenarios', bullets: ['Stone in a circle — Tension in the string.', 'Planet around sun — Gravitational force.', 'Car on horizontal turn — Frictional force.'] },
      { title: 'Forces Acting on a Car in Circular Motion', content: 'On a level road, the acting forces are:', bullets: ['Weight of the car: $mg$', 'Normal reaction: $N$', 'Frictional force: $f$'] },
      { title: 'Balancing Forces Vertically', content: 'The vertical forces balance out: $$N - mg = 0 \\implies N = mg$$' },
      { title: 'Friction in Circular Motion', content: 'Friction provides the necessary centripetal force via static friction: $$f = \\frac{mv^2}{R} \\leq \\mu_s N$$ $$v^2 \\leq \\mu_s Rg$$ Maximum speed: $$v_{max} = \\sqrt{\\mu_s Rg}$$' },
      { title: 'Banked Roads and Force Dynamics', content: 'On a banked road with no vertical acceleration: $$N\\cos\\theta = mg + f\\sin\\theta$$ $$N\\sin\\theta + f\\cos\\theta = \\frac{mv^2}{R}$$ At $v_{max}$, $f = \\mu_s N$.' },
      { title: 'Solving for Normal Force', content: 'From the equation $N\\cos\\theta = mg + \\mu_s N\\sin\\theta$: $$N = \\frac{mg}{\\cos\\theta - \\mu_s\\sin\\theta}$$' },
      { title: 'Maximum Speed on Banked Roads', content: 'By substituting N: $$v_{max} = \\sqrt{Rg\\cdot\\frac{\\mu_s + \\tan\\theta}{1 - \\mu_s\\tan\\theta}}$$ Shows greater maximum speed than on a flat road.' },
      { title: 'Special Case: Zero Friction', content: 'When $\\mu_s = 0$, the equation becomes: $$v_o = \\sqrt{Rg\\tan\\theta}$$ At this speed, friction is unnecessary for centripetal force.' },
      { title: 'Parking on a Banked Road', bullets: ['$v < v_o$ implies friction acts up the slope.', 'A car can only park if $\\tan\\theta \\leq \\mu_s$.'] },
      { title: 'Basic Principles of Mechanics', bullets: ['The three laws of motion form the foundation of mechanics.', 'Problems often involve multiple bodies exerting forces on each other.'] },
      { title: 'Understanding Assemblies in Mechanics', bullets: ['An assembly is a group of bodies interacting through forces, including gravity.', 'Each body experiences the force of gravity and contacts forces from others.'] },
      { title: 'Defining System and Environment', bullets: ["Select any part of the assembly as 'the system'.", "The rest of the assembly and other force agencies make up 'the environment'."] },
      { title: 'Steps to Solving Mechanics Problems', numbered: ['Draw a diagram showing all assembly parts, links, and supports.', 'Identify and isolate one part as the system.'] },
      { title: 'Free-body Diagram Explained', bullets: ['Draw it for the chosen system showing all forces acting on it.', 'Include forces from the environment, but not on the environment by the system.'] },
      { title: 'Characteristics of a Free-body Diagram', bullets: ['Include magnitudes and directions of known forces.', 'Unknown forces are determined using the laws of motion.'] },
      { title: "Utilizing Newton's Third Law", bullets: ['If the force on body A by B is F, then force on B by A should be $-F$.', 'Ensure all action-reaction force pairs are correctly depicted.'] },
      { title: 'Solving Complex Mechanical Problems', bullets: ['Select another system if necessary, and replicate the process.', 'Use the same method for continuity and clarity in problem-solving.'] },
      { title: 'Focus on Net Forces', bullets: ['The system might still experience a net force after diagramming.', 'Net forces guide problem analysis and solution derivation.'] },
      { title: 'Applying the Methods', bullets: ['Apply the techniques to solved examples to build understanding.', 'Adapt to different problem scenarios ensuring step-by-step resolution.'] },
    ],
  },

  // ── Add remaining chapters below following same pattern ──────────────────

  'Work Energy and Power': {
    intro: 'Notions of Work and Kinetic Energy: The Work-Energy Theorem',
    sections: [
      { title: 'Work-Energy Theorem', content: 'Work done by forces acting on an object is related to changes in kinetic energy.', bullets: ['$K_f - K_i = W$', '$K$ is kinetic energy $= \\frac{1}{2}mv^2$.', "Newton's Second Law links force and motion: $\\frac{m}{2}(v^2 - u^2) = Fs$"] },
      { title: 'Concept of Work in Physics', content: 'Work in physics is linked to the force applied and the displacement observed. Defined as the product of the force component in the direction of displacement and the magnitude of this displacement. $$W = (F\\cos\\theta)\\,d = \\vec{F}\\cdot\\vec{d}$$' },
      { title: 'Scenarios with No Work Done', bullets: ['Displacement is zero (e.g., holding a steady position without movement).', 'Force is zero (e.g., smooth table scenario with no friction).', 'Force and displacement are perpendicular ($\\theta = 90°$).'] },
      { title: 'No Work Done by Gravitational Force', content: "When force is perpendicular to displacement, gravitational forces don't do work. e.g., Moon's circular orbit around Earth." },
      { title: 'Positive and Negative Work', content: 'The direction of force relative to displacement affects the sign of work.', bullets: ['Positive work: $0° < \\theta < 90°$ ($\\cos\\theta$ is positive).', 'Negative work: $90° < \\theta < 180°$ ($\\cos\\theta$ is negative).', 'Frictional force often results in negative work. At $\\theta = 180°$, $\\cos 180° = -1$.'] },
      { title: 'Units of Work and Energy', content: 'Both work and energy share dimensions of $ML^2T^{-2}$, which translate to joules (J).', bullets: ['erg: $10^{-7}$ J', 'electron volt (eV): $1.6 \\times 10^{-19}$ J', 'calorie (cal): 4.186 J', 'kilowatt hour (kWh): $3.6 \\times 10^6$ J'] },
      { title: 'Implied Force Work Scenario', content: 'Even rigorous activity (like pushing a wall) with no displacement does no physical work despite feeling tired.' },
      { title: 'The Origin of the Joule', content: 'The joule is named after physicist James Prescott Joule, acknowledging his contributions to energy study.' },
      { title: 'Nature of Kinetic Energy', content: 'Kinetic energy is a scalar quantity. It represents the ability of an object to do work due to its motion. $$K = \\frac{1}{2}mv^2$$' },
      { title: 'Historical Applications of Kinetic Energy', bullets: ['Grinding corn using fast-flowing streams.', 'Powering sailing ships with the energy of the wind.'] },
      { title: 'Kinetic Energy Examples',
        table: {
          headers: ['Object', 'Mass', 'Speed', 'Kinetic Energy'],
          rows: [
            ['Car',           '2000 kg',          '25 m/s',  '$6.3 \\times 10^5$ J'],
            ['Running Athlete','70 kg',            '10 m/s',  '$3.5 \\times 10^3$ J'],
            ['Bullet',        '$5 \\times 10^{-2}$ kg', '200 m/s', '$10^3$ J'],
            ['Stone (10 m)',  '1 kg',             '14 m/s',  '$10^2$ J'],
            ['Raindrop',      '$3.5 \\times 10^{-5}$ kg', '9 m/s', '$1.4 \\times 10^{-3}$ J'],
            ['Air Molecule',  '$\\approx 10^{-26}$ kg', '500 m/s', '$\\approx 10^{-21}$ J'],
          ],
        },
      },
      { title: 'Constant vs Variable Force', content: 'A constant force is notably rare. It is actually the variable force that is more commonly encountered in everyday scenarios.' },
      { title: 'Work Done by Variable Force', content: 'For small displacements, force can be approximated as constant: $\\Delta W = F(x)\\Delta x$. Total work: $$W \\cong \\sum_{x_i}^{x_f} F(x)\\Delta x$$' },
      { title: 'Work as a Definite Integral', content: 'For a varying force, work done is expressed by a definite integral: $$W = \\lim_{\\Delta x \\to 0} \\sum_{x_i}^{x_f} F(x)\\Delta x = \\int_{x_i}^{x_f} F(x)\\,dx$$ The area under the force-displacement curve represents the total work done.' },
      { title: 'Understanding Work-Energy Theorem', content: 'The work-energy theorem explains the relation between work done by forces on a body and its change in kinetic energy, specifically for variable forces.' },
      { title: 'Application Limitations', content: "The work-energy theorem is effective in varied scenarios but does not carry the complete information of Newton's second law's dynamics." },
      { title: 'Dimensional Consideration', content: "Newton's law is vectorial in two or three dimensions, whereas the work-energy theorem lacks directional information as it is cast in a scalar form." },
      { title: 'The Concept of Potential Energy', content: "Potential energy refers to the 'stored energy' due to the position or shape of an object. This stored energy can be converted into kinetic energy when an object is released or set in motion.", bullets: ['A stretched bowstring stores potential energy.', "Fault lines in the Earth's crust act like compressed springs with stored potential energy."] },
      { title: 'Gravitational Potential Energy', content: 'Raising a ball to height $h$ requires work $mgh$, stored as potential energy: $$V(h) = mgh$$' },
      { title: 'Force and Potential Energy Relationship', content: 'The gravitational force $F$ is the negative derivative of potential energy $V(h)$ with respect to $h$: $$F = -\\frac{d}{dh}V(h)$$' },
      { title: 'Kinematic Relation for Falling Object', content: 'A falling object accelerates due to gravity, with velocity $v$ satisfying $v^2 = 2gh$, demonstrating conversion from potential to kinetic energy.' },
      { title: 'Potential Energy in One Dimension', content: 'The expression for force in one dimension using potential energy: $$F(x) = -\\frac{dV}{dx}$$ The change in potential energy: $\\Delta V = -F(x)\\Delta x$.' },
      { title: 'The Conservation of Mechanical Energy', content: 'The principle of conservation of mechanical energy for conservative forces:', bullets: ['$\\Delta K + \\Delta V = 0$', '$\\Delta(K + V) = 0$', 'Total mechanical energy $E = K + V =$ constant throughout motion.'] },
      { title: 'Conservative Force Definition', bullets: ['A force is conservative if it can be derived from a potential energy function.', 'The work is dependent only on the endpoints.', 'For closed paths, the work done is zero.'] },
      { title: 'Energy at Different Heights', content: 'Total energies at different heights:', bullets: ['At height $H$: $E_H = mgH$', 'At height $h$: $E_n = mgh + \\frac{1}{2}mv_n^2$', 'At ground: $E_o = \\frac{1}{2}mv_f^2$'] },
      { title: "Hooke's Law and Spring Force", content: 'The spring force $F_s$ is proportional to the displacement $x$ from equilibrium: $$F_s = -kx$$ The constant $k$ is the spring constant (N m$^{-1}$). Spring is stiff if $k$ is large and soft if $k$ is small.' },
      { title: 'Work Done by Spring Force', content: 'If a spring is stretched by $x_m$, work done by the spring: $$W_s = -\\frac{kx_m^2}{2}$$ If compressed by $x_c$: $$W_s = -\\frac{kx_c^2}{2}$$ For cyclic motion: total work by spring force = 0 (conservative force).' },
      { title: 'Potential Energy of the Spring', content: 'The potential energy $V(x)$ of a spring: $$V(x) = \\frac{kx^2}{2}$$ This zeroes at the equilibrium position, where $x = 0$.' },
      { title: 'Equations of Mechanical Energy in Springs', content: 'The total mechanical energy: $$\\frac{1}{2}kx_m^2 = \\frac{1}{2}kx^2 + \\frac{1}{2}mv^2$$ Potential energy converts to kinetic energy and back, maintaining the energy constant.' },
      { title: 'Maximum Speed at Equilibrium', content: 'The speed is maximum at equilibrium $x = 0$: $$v_m = \\sqrt{\\frac{k}{m}}\\,x_m$$ At $x = 0$, kinetic energy is maximum while potential energy minimizes.' },
      { title: 'Conservative vs. Non-Conservative Forces', content: 'Conservative forces, like spring force, depend solely on initial and final positions, unlike non-conservative forces such as friction.' },
      { title: 'Concept of Power', content: 'Power refers to the rate at which work is done or energy is transferred.' },
      { title: 'Average Power Formula', content: 'Average power is calculated as: $$P_{av} = \\frac{W}{t}$$ where $W$ is work done and $t$ is the time taken.' },
      { title: 'Instantaneous Power', content: 'Instantaneous power is the limiting value of average power as time interval approaches zero: $$P = \\frac{dW}{dt} = \\vec{F}\\cdot\\vec{v}$$' },
      { title: 'Power as Scalar Quantity', content: 'Power is a scalar quantity and its dimensions are $[ML^2T^{-3}]$. SI unit: watt (W) $= 1$ J s$^{-1}$. Named after James Watt.' },
      { title: 'Horsepower', content: '$1\\,\\text{hp} = 746\\,\\text{W}$. This is mainly used for automobiles and engines.' },
      { title: 'Understanding Kilowatt Hour (kWh)', content: 'A kilowatt hour refers to energy, not power: $$100\\,\\text{W} \\times 10\\,\\text{hours} = 1000\\,\\text{Wh} = 1\\,\\text{kWh} = 3.6 \\times 10^6\\,\\text{J}$$' },
      { title: 'Collision Overview', content: 'Collisions involve the interaction of two or more bodies where forces are exerted between them, altering their velocities and directions.', bullets: ['Momentum: Total linear momentum is conserved in all collisions.', 'Energy: Kinetic energy may not be conserved, depending on elasticity.'] },
      { title: 'Elastic Collisions', content: 'Elastic collisions are where the total kinetic energy before and after the collision is the same. Objects rebound without permanent deformation.' },
      { title: 'Inelastic Collisions', content: 'These collisions involve some loss of kinetic energy, with energy transforming into heat, sound, or deformation. Completely inelastic collisions result in objects sticking together.' },
      { title: 'Momentum Transfer Equations', content: 'For one-dimensional collisions:', bullets: ['Final velocity: $v_f = \\dfrac{m_1}{m_1 + m_2}\\,v_1$', 'Kinetic energy loss: $\\Delta K = \\dfrac{1}{2}\\dfrac{m_1 m_2}{m_1 + m_2}\\,v_{1f}^2$'] },
      { title: 'Special Collision Cases', bullets: ['Equal masses: First mass stops, second mass moves with initial speed of the first.', 'Mass dominance: Heavier mass undisturbed, lighter mass reverses direction.'] },
      { title: 'One-Dimensional Collisions', content: 'Also called head-on collisions, occur when initial and final velocities are along the same straight line.' },
      { title: 'Two-Dimensional Collisions', content: 'Involve velocities and final movement directions lying in a plane.', bullets: ['Momentum along x and y components are conserved.', 'Elastic collision adds kinetic energy equation.'] },
      { title: 'Scattering', content: 'Describes a type of collision where interaction involves action at a distance, such as celestial bodies encountering gravitational or nuclear influences.' },
      { title: 'Real-World Applications', content: 'Understanding collision mechanics is utilized in games like billiards, carrom, and analyzing atom collisions in physics.' },
    ],
  },

  'System of Particles and Rotational Motion': {
    intro: 'Centre of Mass, Angular Momentum and Rotational Dynamics',
    sections: [
      {
        title: 'Concept of Centre of Mass',
        content: 'The centre of mass of a system of particles is the point where the mass is concentrated. It is significant in analyzing the motion of objects.',
      },
      {
        title: 'Calculation for Two Particles',
        content: 'For two particles with masses $m_1$ and $m_2$ at distances $x_1$ and $x_2$ from an origin, the centre of mass C is: $$X = \\frac{m_1x_1 + m_2x_2}{m_1 + m_2}$$ If $m_1 = m_2$, then: $$X = \\frac{x_1 + x_2}{2}$$',
      },
      {
        title: 'Centre of Mass for n Particles',
        content: 'For multiple particles $n$ along the x-axis: $$X = \\frac{\\sum m_i x_i}{\\sum m_i}$$',
      },
      {
        title: 'Non-linear Arrangement',
        content: 'In case of particles spread in a plane, coordinates $(X, Y)$ can be calculated using: $$X = \\frac{m_1x_1+m_2x_2+m_3x_3}{m_1+m_2+m_3}, \\quad Y = \\frac{m_1y_1+m_2y_2+m_3y_3}{m_1+m_2+m_3}$$ For equal masses, the point corresponds to the centroid of the triangle.',
      },
      {
        title: '3D Distribution of Particles',
        content: 'The generalization into a spatial system with particles at coordinates $(x_i, y_i, z_i)$ gives the centre of mass as: $$X = \\frac{\\sum m_ix_i}{M}, \\quad Y = \\frac{\\sum m_iy_i}{M}, \\quad Z = \\frac{\\sum m_iz_i}{M}$$',
      },
      {
        title: 'Position Vectors and Centre of Mass',
        content: 'Equations can be expressed in vector form: $$\\vec{R} = \\frac{\\sum m_i\\vec{r}_i}{M}$$ Here $\\vec{r}_i$ is the position vector of the particle, and $\\vec{R}$ is of the centre of mass.',
      },
      {
        title: 'Centre of Mass in a Rigid Body',
        content: 'A rigid body can be seen as a closely packed particle system. Equations for centre of mass apply, treating it as a continuous mass distribution. For a continuous mass distribution, integrals replace summations, resulting in exact expressions for large numbers of small mass elements.',
      },
      {
        title: 'Center of Mass of a Thin Rod',
        content: 'The center of mass for a homogeneous thin rod is at its geometric centre due to reflection symmetry in mass distribution.',
      },
      {
        title: 'Reflection Symmetry in Homogeneous Bodies',
        content: 'For symmetrical bodies like spheres, rings, or discs, the origin serves as the point of reflection symmetry, leading the center of mass to lie at the geometric center.',
      },
      {
        title: 'Motion of Centre of Mass',
        content: 'The center of mass for a system of particles is defined as the weighted average of their positions, significant in solving motion problems.',
      },
      {
        title: 'Center of Mass Equation',
        content: '$$M\\vec{R} = m_1\\vec{r}_1 + m_2\\vec{r}_2 + \\cdots + m_n\\vec{r}_n$$ It balances the cumulative effect of all particles\' masses and positions.',
      },
      {
        title: 'Importance of Velocities',
        content: 'Differentiating positions with time: $$M\\vec{V} = m_1\\vec{v}_1 + m_2\\vec{v}_2 + \\cdots + m_n\\vec{v}_n$$ where centre of mass velocity is given by $V = dR/dt$.',
      },
      {
        title: 'Acceleration Dynamics',
        content: '$$M\\vec{A} = m_1\\vec{a}_1 + m_2\\vec{a}_2 + \\cdots + m_n\\vec{a}_n$$ mapping the center of mass acceleration, $A = dV/dt$.',
      },
      {
        title: "Newton's Second Law Application",
        content: 'Total force in a system: $$M\\vec{A} = F_1 + F_2 + \\cdots + F_n$$ where each $F_i$ equals the mass times acceleration of each particle.',
      },
      {
        title: 'External vs. Internal Forces',
        content: 'Internal forces cancel out as per Newton\'s third law, hence only external forces ($F_{ext}$) affect the center of mass: $$M\\vec{A} = \\vec{F}_{ext}$$',
      },
      {
        title: 'Projectiles and Explosions',
        content: "For projectiles, internal explosion forces don't affect the center of mass path. It continues on the same trajectory regardless of the internal burst. Exploding projectile fragments still follow the original parabolic path of the center of mass.",
      },
      {
        title: 'Linear Momentum of a Particle',
        content: 'The linear momentum of a particle: $$\\vec{p} = m\\vec{v}$$',
        bullets: ['p is the linear momentum', 'm is the mass of the particle', 'v is the velocity of the particle'],
      },
      {
        title: "Newton's Second Law for a Single Particle",
        content: '$$\\vec{F} = \\frac{d\\vec{p}}{dt}$$',
      },
      {
        title: 'System of n Particles',
        content: 'The linear momentum of a system with n particles is the vector sum of individual particle momenta:',
        bullets: ['Each particle i has momentum $m_iv_i$', 'Total system momentum: $P = p_1 + p_2 + \\cdots + p_n$'],
      },
      {
        title: 'Total Momentum Equals Mass \u00d7 Centre of Mass Velocity',
        content: '$$\\vec{P} = M\\vec{V}$$ where M is the total mass.',
      },
      {
        title: 'Differentiation of Total Momentum',
        content: '$$\\frac{d\\vec{P}}{dt} = M\\vec{A} = \\vec{F}_{ext}$$',
      },
      {
        title: 'Conservation of Total Linear Momentum',
        content: 'If the total external force on a system is zero, linear momentum remains constant: $$\\frac{d\\vec{P}}{dt} = 0 \\implies \\vec{P} = \\text{Constant}$$ This is the law of conservation of momentum.',
      },
      {
        title: 'Movement with Constant Velocity',
        content: 'If external forces are zero, the velocity of the centre of mass is constant. The centre of mass moves uniformly, even if individual particles have complex paths.',
      },
      {
        title: 'Vector Equations for Momentum',
        content: 'Vector equations can be broken into components:',
        bullets: ['$P_x = c_1$', '$P_y = c_2$', '$P_z = c_3$', 'where $c_1, c_2, c_3$ are constants.'],
      },
      {
        title: 'Radioactive Decay and Momentum',
        content: 'In radioactive decay:',
        bullets: ['Momentum is conserved before and after decay', 'Particles move such that their centre of mass continues along the original path of the decaying particle'],
      },
      {
        title: 'Binary Stars and Centre of Mass',
        content: 'Binary star system dynamics:',
        bullets: ['Centre of mass moves uniformly if no external force acts', 'Stars move in circular orbits around the centre of mass'],
      },
      {
        title: 'Understanding Vector Products',
        content: 'Vector product of two vectors results in a new vector that is perpendicular to the plane containing the original vectors.',
      },
      {
        title: 'Formula for Magnitude of Vector Product',
        content: '$$|\\vec{c}| = ab\\sin\\theta$$ where $a$ and $b$ are the magnitudes of the original vectors, and $\\theta$ is the angle between them.',
      },
      {
        title: 'Direction of Vector Product',
        bullets: ['A right-handed screw, turned in the direction from vector $a$ to vector $b$, moves in the direction of the vector product $c$.', 'Alternately, use the right-hand rule where curling fingers from $a$ to $b$ makes the thumb point in the direction of $c$.'],
      },
      {
        title: 'Reflection Property',
        content: 'Under reflection, where axes are mirrored, $\\vec{a}\\times\\vec{b}$ remains unchanged: $(\\vec{a}\\times\\vec{b}) \\to (-\\vec{a})\\times(-\\vec{b}) = \\vec{a}\\times\\vec{b}$.',
      },
      {
        title: 'Scalar vs. Vector Products',
        bullets: ['Scalar product is commutative: $\\vec{a}\\cdot\\vec{b} = \\vec{b}\\cdot\\vec{a}$', 'Vector product is NOT commutative: $\\vec{a}\\times\\vec{b} \\neq \\vec{b}\\times\\vec{a}$', '$\\vec{a}\\times\\vec{b} = -\\vec{b}\\times\\vec{a}$, indicating opposite directions.'],
      },
      {
        title: 'Right-angle Unit Vectors',
        content: 'The cross product of unit vectors $\\hat{i}, \\hat{j}, \\hat{k}$ forms other unit vectors:',
        bullets: ['$\\hat{i}\\times\\hat{j} = \\hat{k}$', '$\\hat{j}\\times\\hat{k} = \\hat{i}$', '$\\hat{k}\\times\\hat{i} = \\hat{j}$', 'Non-cyclic: $\\hat{j}\\times\\hat{i} = -\\hat{k}$'],
      },
      {
        title: 'Distributive Law',
        content: 'The vector product follows the distributive law: $$\\vec{a}\\times(\\vec{b}+\\vec{c}) = \\vec{a}\\times\\vec{b} + \\vec{a}\\times\\vec{c}$$',
      },
      {
        title: 'Null Vector Property',
        content: 'When a vector is crossed with itself, the result is a null vector: $$\\vec{a}\\times\\vec{a} = 0$$',
      },
      {
        title: 'Determinant Form of Vector Product',
        content: '$$\\vec{a}\\times\\vec{b} = \\begin{vmatrix}\\hat{i}&\\hat{j}&\\hat{k}\\\\a_x&a_y&a_z\\\\b_x&b_y&b_z\\end{vmatrix}$$',
      },
      {
        title: 'Concept of Angular Velocity',
        content: 'In rotational motion, each particle of a body moves in a circle perpendicular to the axis of rotation. Angular velocity measures the rate of change of the angle (angular displacement) that a particle makes around the axis.',
      },
      {
        title: 'Relation Between Linear and Angular Velocity',
        content: 'The linear velocity of a particle: $$v = \\omega r$$ In vector form: $\\vec{v} = \\vec{\\omega}\\times\\vec{r}$',
        bullets: ['$v$ = linear velocity', '$\\omega$ = angular velocity', '$r$ = distance from the axis'],
      },
      {
        title: 'Understanding Rotational Motion',
        content: 'In pure rotational motion, every part of the rigid body moves around a fixed axis with the same angular velocity $\\omega$, which acts as a vector lying along the axis.',
      },
      {
        title: 'Definition of Angular Velocity as a Vector',
        content: 'Angular velocity is a vector that lies along the axis of rotation. It points in the direction a right-handed screw would advance if turned around the axis in the same rotational direction as the body.',
      },
      {
        title: 'Angular Acceleration',
        content: 'Angular acceleration is defined as the rate of change of angular velocity with time: $$\\alpha = \\frac{d\\omega}{dt}$$ When rotation occurs around a fixed axis, the direction of $\\omega$ and $\\alpha$ remain constant.',
      },
      {
        title: 'Understanding Torque and Angular Momentum',
        content: 'Torque and angular momentum are vector products of two vectors essential for understanding the motion of systems and rigid bodies.',
      },
      {
        title: 'Moment of Force / Torque',
        content: 'Rotation in rigid bodies involves torque, the rotational analogue of linear force. The vector product defining torque: $$\\vec{\\tau} = \\vec{r}\\times\\vec{F}$$ Torque is a vector with units newton meter (N m).',
      },
      {
        title: 'Magnitude of Torque',
        content: '$$\\tau = rF\\sin\\theta$$ where $r$ is the position vector\'s magnitude, and $\\theta$ is the angle between the position and force vectors.',
      },
      {
        title: 'Angular Momentum of a Particle',
        content: 'Angular momentum acts as the rotational counterpart of linear momentum: $$\\vec{L} = \\vec{r}\\times\\vec{p}$$',
      },
      {
        title: 'Zero Conditions for Torque and Angular Momentum',
        content: 'Torque and angular momentum become zero:',
        bullets: ['If force or momentum is zero.', 'If the directional path passes through the origin.', 'If vectors align ($\\theta = 0°$ or $180°$).'],
      },
      {
        title: 'Relation Between Torque and Angular Momentum',
        content: 'The change rate in angular momentum equals the torque applied: $$\\frac{d\\vec{L}}{dt} = \\vec{\\tau}$$ For a system: $$\\frac{d\\vec{L}}{dt} = \\vec{\\tau}_{ext}$$',
      },
      {
        title: 'Conservation of Angular Momentum',
        content: 'If external torque is zero, then angular momentum remains constant: $$\\vec{\\tau}_{ext} = 0 \\implies \\vec{L} = \\text{constant}$$',
      },
      {
        title: 'Equilibrium of a Rigid Body',
        content: 'The equilibrium of a rigid body involves both translational and rotational states. Both linear and angular momenta remain unchanging over time.',
        bullets: ['Translational: $\\sum F_i = 0$ (linear momentum constant)', 'Rotational: $\\sum \\tau_i = 0$ (angular momentum steady)', 'Coplanar forces: 2 conditions for translation + 1 for rotation.'],
      },
      {
        title: 'Independence of Rotational Equilibrium',
        content: 'Rotational equilibrium does not depend on the origin point, provided translational equilibrium conditions are satisfied.',
      },
      {
        title: 'Partial Equilibrium',
        content: 'A body may experience partial equilibrium, achieving either translation without rotation or vice versa.',
      },
      {
        title: 'Couple and Torque',
        content: 'A pair of equal, opposite forces acting at different points cause pure rotation without translation, known as a couple. Example: Opening a jar lid involves applying a couple.',
      },
      {
        title: 'Leverage and Mechanical Advantage',
        content: 'Levers use principles of moments to lift loads efficiently. Load arm multiplied by its force = Effort arm multiplied by its force. $$\\text{M.A.} = \\frac{F_1}{F_2} = \\frac{d_2}{d_1}$$',
      },
      {
        title: 'Centre of Gravity (CG)',
        content: "A body's CG is the point where its gravitational torque is zero, allowing balance. Often coincides with the centre of mass in uniform gravitational fields. Suspending an irregular body from multiple points, the intersecting verticals determine its CG.",
      },
      {
        title: 'Moment of Inertia',
        content: 'Moment of inertia is analogous to mass in rotational motion. $$I = \\sum m_ir_i^2$$',
        bullets: ['Each particle KE: $k_i = \\frac{1}{2}m_iv_i^2$', 'Total KE: $K = \\frac{1}{2}I\\omega^2$', 'Rotational KE: $K = \\frac{1}{2}I\\omega^2$ vs Translational: $K = \\frac{1}{2}mv^2$', 'Ring: $I = MR^2$', 'Rod with equal masses: $I = ML^2/4$', 'Radius of gyration: $I = Mk^2$', 'SI units: kg m\u00b2. Dimensions: $[ML^2]$'],
      },
      {
        title: 'Applications of Moment of Inertia: Flywheels',
        bullets: ['Flywheels have a large moment of inertia.', 'They resist sudden speed changes, ensuring smooth movement in devices like steam and automobile engines.', 'Just as mass resists changes in linear motion, moment of inertia resists changes in rotational movement.'],
      },
      {
        title: 'Kinematics of Rotational Motion about a Fixed Axis',
        content: 'Rotational motion around a fixed axis is analogous to translational motion, with angular velocity ($\\omega$) playing the same role as linear velocity ($v$).',
        table: {
          headers: ['Linear Quantity', 'Rotational Quantity'],
          rows: [
            ['Displacement $x$', 'Angular displacement $\\theta$'],
            ['Velocity $v = dx/dt$', 'Angular velocity $\\omega = d\\theta/dt$'],
            ['Acceleration $a = dv/dt$', 'Angular acceleration $\\alpha = d\\omega/dt$'],
            ['$v = v_0 + at$', '$\\omega = \\omega_0 + \\alpha t$'],
            ['$x = x_0 + v_0t + \\frac{1}{2}at^2$', '$\\theta = \\theta_0 + \\omega_0t + \\frac{1}{2}\\alpha t^2$'],
            ['$v^2 = v_0^2 + 2ax$', '$\\omega^2 = \\omega_0^2 + 2\\alpha(\\theta-\\theta_0)$'],
          ],
        },
      },
      {
        title: 'Dynamics of Rotational Motion about a Fixed Axis',
        content: 'In rotational motion, moment of inertia and torque are analogues of mass and force in linear motion.',
        bullets: ['Work done: $dW = \\tau\\,d\\theta$ (analogy with $F\\,ds$)', 'Multiple forces: $dW = (\\tau_1 + \\tau_2 + \\cdots)\\,d\\theta$', 'Instantaneous power: $P = \\tau\\omega$ (analogy with $P = Fv$)', 'Rate of KE change: $\\frac{d}{dt}\\left(\\frac{I\\omega^2}{2}\\right) = I\\omega\\alpha$'],
      },
      {
        title: "Newton's Second Law for Rotational Motion",
        content: '$$\\tau = I\\alpha$$ Torque is related to angular acceleration, analogous to $F = ma$ in linear motion.',
      },
      {
        title: 'Angular Momentum in Case of Rotation about a Fixed Axis',
        content: 'The general expression for angular momentum $L$ of the system of $n$ particles: $$L = \\sum(\\vec{r}_i \\times \\vec{p}_i)$$',
        bullets: ['For a particle: $l = r \\times p$, $v = \\omega r_{\\perp}$', 'Components: $L_z = I\\omega\\hat{k}$, $L = L_{\\perp} + L_z$', 'For symmetric bodies: $L_{\\perp} = 0$, hence $L = L_z = I\\omega\\hat{k}$', 'Conservation: if external torque = 0, $L_z = I\\omega$ remains constant.', 'Real-life: Stretching arms increases I, reducing $\\omega$; bringing arms in decreases I, increasing $\\omega$. Applied in acrobatics, skating, dancing.', 'Practical: In a swivel chair, stretching and bringing arms changes $\\omega$ due to changes in I.'],
      },
      {
        title: 'Rolling Motion',
        content: 'Rolling down the plane, a cylinder undergoes a combination of translational and rotational motion.',
        bullets: ['Pure translational motion: all particles move with the same velocity at any given time.', 'Fixed axis rotation: occurs about a fixed line (ceiling fans, potter\'s wheels, merry-go-rounds).', 'Rotation without fixed axis: A top spinning — axis moves but remains fixed at a point (precession).', 'Rolling = translation of CM + rotation about CM', 'Pure Translation: Same velocity for all particles, orientation unchanged.', 'Rotation: Involves change of orientation, can occur with or without translation.'],
      },
    ],
  },

  'Gravitation': {
    intro: "Kepler's Laws of Planetary Motion",
    sections: [
      {
        title: 'Concept of Gravity',
        content: 'All material objects are attracted towards the Earth. This natural phenomenon can be observed in:',
        bullets: ['Objects falling after being thrown upwards.', 'Effort needed to go uphill compared to downhill.', 'Raindrops falling towards Earth.'],
      },
      {
        title: "Galileo's Contribution",
        content: "Italian physicist Galileo (1564-1642) demonstrated that all bodies accelerate towards the Earth with a constant rate, regardless of their mass. He used experiments with inclined planes to determine gravity's acceleration value.",
      },
      {
        title: 'Celestial Observations',
        content: 'Observations since ancient times distinguished:',
        bullets: ['Fixed stars with unchanged positions.', 'Planets moving regularly against the starry sky background.'],
      },
      {
        title: 'Geocentric and Heliocentric Models',
        bullets: ['The geocentric model, proposed by Ptolemy, described all celestial bodies orbiting Earth in circles.', 'Aryabhatta proposed the heliocentric model, with planets revolving around a central sun.', "Copernicus's 16th-century definitive heliocentric model was supported by Galileo despite opposition."],
      },
      {
        title: 'Tycho Brahe and Johannes Kepler',
        content: "Tycho Brahe's meticulous planetary observations, analyzed by his assistant Kepler, led to the formulation of three significant laws about planetary motion.",
      },
      {
        title: "Kepler's First Law — Law of Orbits",
        content: 'All planets move in elliptical orbits around the Sun, located at one focus of the ellipse. The ellipse can be drawn using two foci and a taut string.',
      },
      {
        title: "Kepler's Second Law — Law of Areas",
        content: 'A line joining a planet to the Sun sweeps equal areas in equal time intervals. Indicates that planets move faster when closer to the Sun.',
        bullets: ['Angular momentum remains constant for any central force, including gravity.', 'Gravitational pull is directed along the vector joining the Sun and the planet.'],
      },
      {
        title: "Kepler's Third Law — Law of Periods",
        content: 'The square of a planet\'s orbital period is proportional to the cube of the semi-major axis of its orbit: $$T^2 \\propto a^3$$ This relationship was verified by data from planetary motion measurements.',
      },
      {
        title: 'Central Force and Gravitation',
        content: "Gravitation is an example of a central force, thus supporting Kepler's Law of Areas, which states that the area swept by planets in equal time periods is constant.",
      },
      {
        title: 'Universal Law of Gravitation',
        content: "Newton's universal law of gravitation explains terrestrial gravitation and Kepler's laws, inspired by the fall of an apple. The moon experiences centripetal acceleration due to Earth's gravity.",
      },
      {
        title: 'Distance and Gravity',
        content: 'The gravitational force from Earth decreases with distance. It is inversely proportional to the square of the distance from the Earth\'s center.',
      },
      {
        title: "Newton's Universal Law Statement",
        content: 'Every object in the universe attracts others with a force proportional to the product of their masses and inversely proportional to the square of their distance: $$F = \\frac{Gm_1m_2}{r^2}$$',
      },
      {
        title: 'Gravitational Force Direction',
        content: "The gravitational force is attractive. Newton's third law states that the force on one mass from another is equal and opposite.",
      },
      {
        title: 'Collection of Point Masses',
        content: 'For a collection of point masses, the force on one is the vector sum of forces exerted by others.',
      },
      {
        title: 'Special Cases of Hollow Spherical Shell',
        bullets: ['Special Case 1: A point mass outside a hollow shell feels as if the mass is concentrated at the center.', 'Special Case 2: The force inside the shell is zero. Forces from the shell cancel each other completely.'],
      },
      {
        title: 'The Gravitational Constant G',
        content: 'The gravitational constant, denoted as G, is a key factor in the Universal Law of Gravitation that can be determined through experimentation.',
      },
      {
        title: "Henry Cavendish's Experiment",
        content: 'Henry Cavendish first measured G in 1798 using a specially designed apparatus to detect gravitational forces between lead spheres.',
        bullets: ['A bar labeled AB has small lead spheres at its ends.', "It's suspended by a fine wire, allowing detection of gravitational influence through rotational torque.", 'Large spheres S1 and S2 placed near small spheres initiate gravitational interaction.', 'The gravitational pull creates torque, causing the bar to rotate.'],
      },
      {
        title: 'Formula for Gravitational Force',
        content: '$$F = \\frac{GMm}{d^2}$$ This equation guides the calculation of forces between masses.',
      },
      {
        title: 'Calculating G',
        content: 'Equilibrium: restoring torque equals gravitational torque. From observations of the twist angle $\\theta$: $$G\\frac{Mm}{d^2}\\cdot L = \\tau\\theta$$',
      },
      {
        title: 'Current Value of G',
        content: '$$G = 6.67\\times10^{-11}\\text{ N m}^2/\\text{kg}^2$$',
      },
      {
        title: 'Structure of Earth',
        content: 'The Earth can be visualized as a sphere made from multiple concentric spherical shells, with the smallest one at the center and the largest at the surface.',
      },
      {
        title: 'Gravitational Force Outside Earth',
        content: "Outside the Earth, it's as if the entire Earth's mass is concentrated at its center exerting gravitational force on any point outside.",
      },
      {
        title: 'Gravitational Force Inside Earth',
        content: 'When a point is inside the Earth, the gravitational influence is only due to the mass inside the sphere of radius equal to the distance from the center.',
        bullets: ['Force on mass $m$ at radius $r$: $F = \\frac{Gm M_r}{r^2}$', 'Mass of sphere radius $r$: $M_r = \\frac{4\\pi}{3}\\rho r^3$'],
      },
      {
        title: 'Acceleration Due to Gravity',
        content: 'When a mass is on Earth\'s surface: $F = \\frac{GM_Em}{R_E^2}$. By Newton\'s second law: $$g = \\frac{GM_E}{R_E^2}$$ Knowing $g$, $R_E$, and $G$ allows estimation of Earth\'s mass $M_E$ — "Cavendish weighed the Earth".',
      },
      {
        title: 'Acceleration due to Gravity Below the Surface',
        content: '$$g(d) = \\frac{GM_E}{R_E^3}(R_E - d) = g\\left(1 - \\frac{d}{R_E}\\right)$$ As one goes below the Earth\'s surface, gravitational acceleration reduces by factor $(1 - d/R_E)$.',
      },
      {
        title: 'Key Takeaway on Gravity',
        content: 'Both elevation above and depth beneath Earth\'s surface result in decreased gravitational acceleration. The surface of Earth presents the maximum gravitational force.',
      },
      {
        title: 'Gravitational Potential Energy',
        content: 'Potential energy is the energy stored in a body due to its position.',
        bullets: ['Change in PE = work done by a force when position changes.', 'Conservative forces: work done is independent of the path. Gravity is conservative.', 'At far distances: $F = \\frac{GM_Em}{r^2}$', 'Potential energy: $W(r) = -\\frac{GM_Em}{r}$ (choosing zero at infinity)', 'Gravitational PE of two masses: $V = -\\frac{Gm_1m_2}{r}$'],
      },
      {
        title: 'Concept of Escape Speed',
        content: 'The principle of conservation of energy aids in determining an object\'s ability to escape Earth\'s gravitational pull. The energy of an object is the sum of its potential and kinetic energy. Due to lower escape velocity, the Moon lacks an atmosphere as gas molecules escape its gravitational pull.',
      },
      {
        title: 'Earth Satellites Overview',
        content: "Earth satellites revolve around the Earth similar to how planets revolve around the Sun, following Kepler's laws of planetary motion. Satellite orbits around Earth can be circular or elliptic. The moon is a natural satellite with a near circular orbit taking approximately 27.3 days.",
        bullets: ['Enabled countries including India to launch artificial satellites.', 'Used for telecommunication, geophysics, and meteorology.'],
      },
      {
        title: 'Energy of an Orbiting Satellite',
        content: 'Orbiting Satellite Energy Formulae:',
        bullets: ['Kinetic energy: $K.E. = \\frac{1}{2}mv^2$', 'In a circular orbit: $K.E. = \\frac{GmM_E}{2(R_E+h)}$', 'At infinity, gravitational PE is zero. At distance $(R_E+h)$: $P.E. = -\\frac{GmM_E}{R_E+h}$', 'K.E. is positive; P.E. is negative. K.E. is half of P.E. in magnitude.', 'Total energy: $E = K.E. + P.E. = -\\frac{GmM_E}{2(R_E+h)}$', 'Total energy is negative for stable orbits. P.E. is negative but twice K.E.', 'In elliptic orbits: both K.E. and P.E. vary by position, but total energy remains constant and negative.', 'Total energy must be negative for satellites to maintain finite distance. Positive or zero total energy results in escaping to infinity.'],
      },
    ],
  },

  'Mechanical Properties of Solids': {
    intro: 'Stress and Strain',
    sections: [
      {
        title: 'Introduction to Mechanical Properties',
        content: 'Solids have a definite shape and size but can be deformed when force is applied. Rigid bodies are not perfect in reality; they can stretch, compress, or bend.',
      },
      {
        title: 'Elasticity of Solids',
        content: 'Elasticity is a property allowing a body to regain its shape and size after removing an applied force, like a helical spring restoring its length. Materials like steel and concrete show elastic behavior, essential for designing structures and machines.',
      },
      {
        title: 'Plasticity Explained',
        content: "Plasticity refers to a material's tendency not to regain its shape after deformation, as seen with putty or mud. They can be permanently deformed, making them ideal plastics.",
      },
      {
        title: 'Importance of Elasticity in Design',
        content: 'Knowledge of material elasticity is vital for engineering designs, such as constructing buildings, bridges, automobiles, and planes.',
      },
      {
        title: 'Definition of Stress',
        content: 'Stress is the restoring force per unit area on a body when under deformation: $$\\text{Stress} = \\frac{F}{A}$$ where F is the applied force and A is the area of cross-section. Unit: Pascal (Pa). Dimensions: $[ML^{-1}T^{-2}]$.',
      },
      {
        title: 'Types of Stress',
        bullets: ['Tensile Stress: Occurs when a body is stretched.', 'Compressive Stress: Occurs when a body is compressed.', 'Shearing Stress: Occurs when deforming forces are applied parallel to the body\'s surface.', 'Hydraulic Stress: Occurs when a body is uniformly compressed by a fluid.'],
      },
      {
        title: 'Strain',
        content: 'Strain is the measure of deformation representing the displacement between particles relative to a reference length. It is a dimensionless quantity: $$\\text{Strain} = \\frac{\\text{Change in dimension}}{\\text{Original dimension}}$$',
      },
      {
        title: 'Longitudinal Stress and Strain',
        content: 'When a body is subjected to longitudinal stress (tensile or compressive), the resulting change in length is represented by longitudinal strain: $$\\text{Longitudinal Strain} = \\frac{\\Delta L}{L}$$ where $\\Delta L$ is the change in length and $L$ is the original length.',
      },
      {
        title: 'Shearing Stress and Strain',
        content: 'Shearing stress involves parallel forces causing tangential deformation. The resulting displacement is captured as shearing strain: $$\\text{Shearing Strain} = \\frac{\\Delta x}{L} = \\tan\\theta \\approx \\theta$$ where $\\Delta x$ is the relative displacement and $\\theta$ is the angular distortion.',
      },
      {
        title: 'Hydraulic Stress and Volume Strain',
        content: 'In hydraulic stress, fluid applies perpendicular forces reducing the body\'s volume: $$\\text{Volume Strain} = \\frac{\\Delta V}{V}$$ where $\\Delta V$ is the change in volume and $V$ is the original volume. No change in shape occurs.',
      },
      {
        title: "Definition of Hooke's Law",
        content: "Stress and strain are proportional to each other for small deformations as per Hooke's law: $$\\text{stress} = k\\times\\text{strain}$$ The proportionality constant $k$ is called the modulus of elasticity. Hooke's law is an empirical law valid for most materials when they undergo small deformations.",
      },
      {
        title: "Applications of Hooke's Law",
        bullets: ['Used to determine the elastic properties of materials.', 'Essential for understanding material behavior under stress.', "Understanding this law is critical in fields such as material science and engineering."],
      },
      {
        title: 'Introduction to Stress-Strain Curve',
        content: 'This curve represents the relationship between stress and strain for a material under tensile stress. It is obtained through experimental testing using a standard test cylinder or wire.',
      },
      {
        title: 'Regions of the Stress-Strain Curve',
        bullets: ['Region O to A (Elastic Region): curve is linear, obeys Hooke\'s law. Body regains its original dimensions on removing force.', 'Region A to B (Elastic Limit): stress and strain not proportional, but body still returns to original dimensions. B = elastic limit or yield point, yield strength $\\sigma_y$.', 'Plastic Deformation (B to D): strain rapidly increases if stress exceeds yield strength. On removing load, dimensions not fully recovered — permanent plastic deformation.', 'Point D (Ultimate Tensile Strength): maximum stress the material can withstand before fracture. Beyond D, fracture occurs at point E.', 'Brittle vs. Ductile: if ultimate strength and fracture points are close → brittle; if far apart → ductile.', "Elastomers Like Rubber: stretch significantly more without breaking, but don't follow Hooke's law.", "Elastic Tissues Example: the aorta's elastic tissue exemplifies elastomers — large elastic region but doesn't follow Hooke's law."],
      },
      {
        title: "Young's Modulus (Y)",
        content: "Young's modulus, denoted by Y, is the ratio of tensile or compressive stress to longitudinal strain. Unit: Pascal (Pa). $$Y = \\frac{\\sigma}{\\varepsilon} = \\frac{F\\times L}{A\\times\\Delta L}$$",
        bullets: ['Metals have high Young\'s modulus.', 'Steel shows high elasticity among common materials.', 'Glass, wood, concrete have lower moduli.'],
      },
      {
        title: 'Shear Modulus (G)',
        content: 'Shear modulus, or modulus of rigidity, is denoted by G. It is the ratio of shear stress to shear strain. Unit: Pascal (Pa). $$G = \\frac{\\sigma_s}{\\theta}$$',
        bullets: ['Steel: 84 GPa', 'Iron: 70 GPa', 'Nickel: 77 GPa', 'Soft and flexible materials like wood have lower values.'],
      },
      {
        title: 'Bulk Modulus (B)',
        content: 'Bulk modulus, denoted by B, measures the ability to withstand hydraulic stress. It is the ratio of hydraulic stress to hydraulic strain. $$B = -\\frac{p}{\\Delta V/V}$$',
        bullets: ['Solids are less compressible (high B).', 'Liquids have intermediate compressibility.', 'Gases are highly compressible (low B).'],
      },
      {
        title: "Poisson's Ratio",
        content: "Poisson's ratio is the ratio of lateral strain to longitudinal strain. It is a dimensionless quantity that describes material deformation under stress.",
      },
      {
        title: 'Elastic Potential Energy',
        content: 'Elastic potential energy is stored in a wire under tensile stress: $$U = \\frac{1}{2}\\times\\sigma\\times\\varepsilon\\times\\text{Volume}$$ Where $U$ is total energy and $u$ = energy per unit volume.',
      },
      {
        title: 'Applications of Elastic Behaviour of Materials',
        content: 'The elastic behaviour of materials is crucial in engineering designs, ensuring structures like buildings and bridges can withstand loads without permanent deformation.',
        bullets: ['Cranes use thick metal ropes — for a crane lifting 10 tonnes, rope cross-section $\\geq 3.3\\times10^{-4}$ m².', 'A factor of ten in load capacity is advised for safety. Ropes are braided from thin wires for flexibility and strength.', 'Bridges need high-strength materials with large Young\'s modulus to minimize bending.', 'Beam sag: $\\delta = \\frac{Wl^3}{4bd^3Y}$. Increasing depth reduces bending more effectively than increasing breadth.', 'I-beams: efficient cross-section for load bearing. Pyramidal shapes are natural outcomes of structural engineering.', 'Maximum mountain height on Earth $\\sim 10$ km, limited by rock elasticity. Elastic limit of rocks is $\\sim 30\\times10^7$ N m$^{-2}$.', 'Area of rope cross-section: $A \\geq W/\\sigma_y$', 'Maximum mountain height: $h = \\frac{30\\times10^7}{3\\times10^3\\times10}$'],
      },
    ],
  },

  'Mechanical Properties of Fluids': {
    intro: "Pressure, Viscosity and Bernoulli's Theorem",
    sections: [
      {
        title: 'Introduction to Fluid Mechanics',
        content: 'Fluid mechanics deals with the behavior and properties of liquids and gases. These are commonly known as fluids. Unlike solids, fluids do not possess a definite shape and can easily flow.',
      },
      {
        title: "Pascal's Law",
        content: 'Blaise Pascal\'s principle states that pressure applied to a confined fluid is transmitted undiminished in all directions throughout the fluid. This principle is fundamental in hydraulic systems.',
        bullets: ['Hydraulic lifts amplify human force to lift heavy loads.', 'Hydraulic brakes ensure even distribution of pressure across brake systems leading to effective braking.'],
      },
      {
        title: 'Atmospheric Pressure',
        content: "It's the pressure exerted by the weight of the atmosphere above you.",
        bullets: ['Measured using devices like the mercury barometer.', 'Standard atmospheric pressure at sea level is approximately 101,325 Pa.'],
      },
      {
        title: 'Hydrostatic Paradox',
        content: 'Despite different shapes of containers, the pressure at the bottom is solely dependent on the liquid height. Demonstrates that pressure at a specific depth in fluids remains uniform.',
      },
      {
        title: 'Devices for Measuring Pressure',
        content: 'Devices such as barometers and manometers are used to measure fluid pressure. They function based on pressure differences and levels in a contained fluid.',
      },
      {
        title: 'Hydraulic Machines',
        content: 'Utilize Pascal\'s principle to multiply force. Examples include hydraulic brakes and lifts, where small force applications are converted into larger outputs.',
      },
      {
        title: 'Understanding Fluid Dynamics',
        content: 'The study of fluids in motion is known as fluid dynamics, contrasting with fluids at rest.',
      },
      {
        title: 'Characteristics of Steady Flow',
        content: 'Fluid flow is termed steady when the velocity of each passing fluid particle at a point remains constant at any time. A streamline is a path in a steady flow where its tangent indicates the direction of fluid velocity at that point. Fluid particles follow smooth trajectories that do not intersect.',
      },
      {
        title: 'Equation of Continuity',
        content: 'Conservation of mass for incompressible fluid flow: $$A_1v_1 = A_2v_2 = \\text{constant}$$ Area times velocity ($Av$) represents volume flux, or flow rate, which remains constant throughout. In narrow regions with closely spaced streamlines, the fluid\'s velocity increases.',
      },
      {
        title: 'Critical Speed and Turbulence',
        content: 'If fluid speed surpasses a specific limit, steadiness is lost, leading to turbulence. Laminar flow exhibits parallel velocities, while turbulent flow shows chaotic patterns and eddies.',
      },
      {
        title: 'Concept of Viscosity',
        content: 'Viscosity is the resistance to motion in fluids due to internal friction, similar to solid surface friction. It arises from relative motion between fluid layers.',
        bullets: ['Honey is more viscous than oil, requiring greater force to move at the same speed.', 'Fluid closest to the moving surface is fastest; near the fixed surface is stationary (velocity gradient).', 'In laminar flow, layers slide over each other.', 'In pipe flow, velocity is highest along the axis and decreases towards the pipe walls, where it becomes zero.'],
      },
      {
        title: 'Coefficient of Viscosity',
        content: 'Viscosity ($\\eta$) is the ratio of shearing stress to strain rate. SI unit: poiseuille (Pl) or N s m$^{-2}$. Dimensions: $[ML^{-1}T^{-1}]$.',
        bullets: ['Viscosity decreases with temperature in liquids.', 'Viscosity increases with temperature in gases.', 'Water at 20°C: 1.0 mPl', 'Blood at 37°C: 2.7 mPl', 'Honey: 200 mPl.'],
      },
      {
        title: "Stokes' Law and Terminal Velocity",
        content: "A body falling through a fluid experiences a retarding viscous force, proportional to velocity, as per Stokes' Law: $$F = 6\\pi\\eta av$$",
        bullets: ['Initial acceleration due to gravity.', 'Retarding force builds.', 'Achieves constant (terminal) velocity when gravitational force equals resistive forces.'],
      },
      {
        title: "Bernoulli's Principle Overview",
        content: "Fluid flow is complex but can be understood using the conservation of energy. Bernoulli's equation relates pressure differences to velocity and elevation changes: $$P + \\frac{1}{2}\\rho v^2 + \\rho gh = \\text{constant}$$",
      },
      {
        title: "Assumptions in Bernoulli's Principle",
        bullets: ['No energy lost due to friction (ideal fluids)', 'The fluid is incompressible', 'Flow must be steady', 'Not applicable for turbulent flows', "Bernoulli can't be applied if there is significant viscosity or compressibility in fluid flow."],
      },
      {
        title: "Torricelli's Law of Efflux",
        content: 'Describes the speed of fluid outflow. For an open tank, the efflux speed resembles the speed of a freely falling body: $$v = \\sqrt{2gh}$$',
      },
      {
        title: 'Dynamic Lift and Magnus Effect',
        content: 'Dynamic lift arises due to motion through a fluid.',
        bullets: ['Non-spinning: Symmetrical airflow, zero pressure difference.', 'Spinning: Air velocity differences cause pressure differences, leading to upward force (dynamic lift).', 'Aerofoil achieves lift through orientation causing different airflow speeds above and below, generating an upward force.', 'Applications: explains spinning balls in sports, design of aircraft wings, understanding fluid outflows.'],
      },
      {
        title: 'SURFACE TENSION',
        content: 'Surface tension is a force per unit length acting in the plane of the interface between a liquid and another substance, also interpreted as extra energy that molecules at the interface possess compared to interior molecules.',
        bullets: ['Explains why water forms droplets, oil rises up a wick.', 'Intermolecular attraction maintains energy within the liquid surface, resulting in additional energy at these surfaces.', 'Water and mercury exhibit differing surface tension behavior.'],
      },
      {
        title: 'SURFACE ENERGY',
        content: 'Liquids maintain cohesion due to intermolecular attraction. Surface energy refers to the energy level distinct from the liquid\'s bulk.',
        bullets: ['Molecules on a liquid surface are missing some intermolecular attractions found fully inside the liquid, so they have more energy.', 'Surface energy is required to increase a liquid\'s surface area.', 'Surfaces endeavor to maintain the least surface area possible as external conditions allow.'],
      },
      {
        title: 'LIQUID INTERFACE CONSIDERATION',
        content: 'The energy of a surface depends on the materials at both sides of the interface.',
        bullets: ['Attraction or repulsion between surfaces affects the surface energy.', 'Molecules experiencing repulsive forces result in higher surface energy; attractive forces reduce surface energy.', 'Different fluid-solid interactions determine if a liquid spreads or forms droplets.'],
      },
      {
        title: 'ANGLE OF CONTACT',
        content: 'The angle of contact $\\theta$ between a liquid surface and solid is a measure of wetting.',
        bullets: ['Acute angle $\\theta$: good wetting, seen when liquids spread over solids like plastics or glass.', 'Obtuse $\\theta$: poor wetting, prompting droplets as seen in water on waxy surfaces.', 'Adjusting $\\theta$ through materials like detergents or waterproofing agents alters spreading behavior.'],
      },
      {
        title: 'DROPS AND BUBBLES',
        content: 'Surface tension tends to minimize the surface area of a liquid, making bubbles and drops spherical.',
        bullets: ['For a spherical drop, internal pressure exceeds external pressure, forming a stable shape due to surface tension.', 'Bubbles differ from drops as they possess two interfaces.', 'Formation of bubbles requires overcoming surface tension by applying internal pressure.'],
      },
      {
        title: 'CAPILLARY ACTION',
        content: 'The pressure difference due to surface tension causes liquids to rise in narrow tubes, defining capillary action.',
        bullets: ['Observed when liquid-air interfaces create a pressure difference, leading water to rise in narrow tubes.', 'Capillary rise inversely relates to the tube\'s radius; smaller radii result in significant rise.'],
      },
      {
        title: 'PHYSICAL PROPERTIES and SURFACE TENSION APPLICATION',
        content: 'Temperature influences physical properties like surface tension. Surface tension typically decreases as temperature increases. Water at 20°C has a surface tension of 0.0727 N/m due to hydrogen bonding.',
        bullets: ['Wetting agents in detergents reduce $\\theta$ to enhance cleaning efficiency.', 'Waterproofing agents maximize $\\theta$ to promote non-wetting characteristics.', "Surface tension's influence spans across sap rising in trees, oil wicking, and drop formations in nature and technology."],
      },
    ],
  },

  'Thermal Properties of Matter': {
    intro: 'Thermal Radiation, Thermal Expansion and Heat Transfer',
    sections: [
      {
        title: "Stefan's Law",
        content: 'According to it the radiant energy emitted by a perfectly black body per unit area per second (i.e., emissive power of black body) is directly proportional to the fourth power of its absolute temperature: $$E = \\sigma T^4$$ where $\\sigma$ = Stefan\'s constant having dimension $[MT^{-3}\\theta^{-4}]$ and value $5.67\\times10^{-8}$ W/m²K⁴.',
        bullets: ['If $e$ is the emissivity of the body then $E = e\\sigma T^4$', 'If $Q$ is the total energy radiated by the body then $Q = At\\cdot e\\sigma T^4$', 'If a body at temperature $T$ is surrounded by a body at temperature $T_0$, then $E = e\\sigma(T^4 - T_0^4)$'],
      },
      {
        title: 'Nature of Thermal Radiation',
        content: 'Radiation emitted by a black body is a mixture of waves of different wavelengths and only a small range of wavelength has significant contribution in the total radiation. A body is heated at different temperatures and energy of radiation is plotted against wavelength for different temperatures to get characteristic curves.',
        images: ['blackbody_radiation'],
        imageLabels: ['Energy (E) vs Wavelength (λ) at temperatures T₁ < T₂ < T₃'],
        imageSource: 'ch10',
        bullets: ['Energy is not uniformly distributed in the radiation spectrum of black body.', 'At a given temperature the intensity of radiation increases with increase in wavelength, becomes maximum at particular wavelength ($\\lambda_m$) and further increase in wavelength leads to decrease in intensity.', 'Increase in temperature causes increase in energy emission for all wavelengths.', 'Increase in temperature causes decrease in $\\lambda_m$, where $\\lambda_m$ is wavelength corresponding to highest intensity. As $T$ increases: $\\lambda_3 < \\lambda_2 < \\lambda_1$.'],
      },
      {
        title: "Wien's Displacement Law",
        content: '$\\lambda_m$ is inversely proportional to the absolute temperature of the emitter: $$\\lambda_m T = b$$ where $b$ is a constant known as Wien\'s constant. $b = 0.2896\\times10^{-2}$ m·K for black body.',
      },
      {
        title: 'Understanding Thermal Expansion',
        content: 'When materials are heated, they tend to expand; conversely, they contract when cooled. This is a common observation with metals, liquids, and gases.',
      },
      {
        title: 'Linear Expansion in Solids',
        content: 'The increase in the length of an object with temperature is called linear expansion. The fractional change in length is proportional to temperature change: $$\\Delta L = \\alpha_L L\\Delta T$$ The coefficient $\\alpha_L$ is a material property indicating how much a material expands per degree change in temperature.',
        bullets: ['Metals generally have higher $\\alpha_L$ values.', 'Example: Copper expands five times more than glass at the same temperature change.', 'Area expansion: $\\Delta A = 2\\alpha_L A\\Delta T$', 'Volume expansion: $\\Delta V = 3\\alpha_L V\\Delta T$ (for isotropic solids)'],
      },
      {
        title: "Water's Anomalous Behavior",
        content: 'Water contracts when heated from 0°C to 4°C, resulting in maximum density at 4°C. This ensures that ice forms on the surface, preserving aquatic life below.',
      },
      {
        title: 'Thermal Expansion of Gases',
        content: 'Gases expand more than liquids and solids on heating. Volume expansion for gases is dependent on temperature and is significant compared to liquids and solids.',
      },
      {
        title: 'Mathematics of Thermal Stress',
        content: 'Restricting thermal expansion causes compressive thermal stress. Example: A steel rail due to this can undergo significant force and bending under temperature change.',
      },
      {
        title: 'Use of Expansion Data',
        content: 'Tables provide typical expansion coefficients for various materials, assisting in practical applications like designing thermal elements or solving structural issues related to temperature changes.',
      },
    ],
  },

  'Thermodynamics': {
    intro: 'Laws of Thermodynamics and Heat Engines',
    sections: [
      {
        title: 'Zeroth Law of Thermodynamics',
        content: 'The Zeroth Law was formulated by R.H. Fowler in 1931, following the formulation of the first and second laws. It defines temperature as a thermodynamic variable.',
      },
      {
        title: 'Concept of Thermodynamic Systems',
        content: 'Two systems, labeled as A and B, can be separated by an adiabatic wall which prevents the exchange of heat.',
      },
      {
        title: 'Role of a Conducting Wall',
        content: 'A conducting wall allows heat to transfer between two systems, facilitating thermal equilibrium.',
      },
      {
        title: 'Achieving Equilibrium with System C',
        content: 'Initially, systems A and B achieve thermal equilibrium through interaction with a third system C via a conducting wall.',
      },
      {
        title: 'Replacing Walls',
        content: 'After A and B achieve equilibrium with C, the adiabatic wall between A and B can be replaced by a conducting wall while C is insulated.',
      },
      {
        title: 'Resulting Equilibrium Between A and B',
        content: 'Systems A and B remain in thermal equilibrium, demonstrating the Zeroth Law of Thermodynamics.',
      },
      {
        title: 'Statement of Zeroth Law',
        bullets: [
          'Two systems in thermal equilibrium with a third system are in equilibrium with each other.',
          'The variable that is equal in two systems in thermal equilibrium is known as temperature (T).',
          'Thus, systems A and B are in thermal equilibrium as a result of their initial equilibria with system C.',
        ],
      },
      {
        title: 'First Law of Thermodynamics',
        content: 'The principle focuses on conservation of energy: energy cannot be created or destroyed, only transformed from one form to another. $$\\Delta U = Q - W$$ where $\\Delta U$ is change in internal energy, $Q$ is heat supplied, and $W$ is work done by the system.',
      },
      {
        title: 'Limitations of the First Law',
        content: 'Observations show many processes are possible in theory under this law but do not occur in reality, indicating additional natural principles are needed.',
        bullets: [
          'A book never spontaneously jumps from a table even though energy conversion would allow it.',
          'Internal energy does not convert to mechanical energy spontaneously.',
        ],
      },
      {
        title: 'Second Law of Thermodynamics',
        content: 'This law introduces further restrictions beyond energy conservation, explaining why certain phenomena cannot occur despite meeting the First Law criteria.',
        bullets: [
          'It limits the efficiency of heat engines and the performance coefficient of refrigerators.',
          "States that an engine's efficiency can never reach 100%.",
          "A refrigerator's performance coefficient can never be infinite.",
        ],
      },
      {
        title: 'Kelvin-Planck Statement',
        content: 'No process allows the complete conversion of heat absorbed from a source solely into work.',
      },
      {
        title: 'Clausius Statement',
        content: 'It is not feasible to transfer heat from a colder body to a hotter body without additional work.',
      },
      {
        title: 'Equivalence of Statements',
        content: 'Both Kelvin-Planck and Clausius statements are fundamentally equivalent and imply the same natural restrictions.',
      },
      {
        title: 'Heat Engines and Efficiency',
        content: 'The Second Law stipulates that no heat engine can convert heat fully into work — it always needs a heat sink to operate. Efficiency of a heat engine: $$\\eta = 1 - \\frac{Q_2}{Q_1} = \\frac{W}{Q_1}$$ where $Q_1$ is heat absorbed and $Q_2$ is heat released.',
      },
      {
        title: 'Carnot Engine',
        content: 'The Carnot engine is a theoretical heat engine operating on the Carnot cycle — the most efficient possible between two temperature reservoirs: $$\\eta_{Carnot} = 1 - \\frac{T_2}{T_1}$$ where $T_1$ is source temperature and $T_2$ is sink temperature.',
      },
      {
        title: 'Refrigerators and Heat Pumps',
        content: 'A refrigerator transfers heat from cold to hot body using external work. Coefficient of performance: $$\\beta = \\frac{Q_2}{W} = \\frac{Q_2}{Q_1 - Q_2} = \\frac{T_2}{T_1 - T_2}$$ According to the Second Law, indefinitely transferring heat from cold to hot automatically violates thermodynamic principles.',
      },
      {
        title: 'Thermodynamic Processes',
        bullets: [
          'Isothermal process: Temperature constant, $\\Delta T = 0$, $\\Delta U = 0$, $Q = W$.',
          'Adiabatic process: No heat exchange, $Q = 0$, $W = -\\Delta U$.',
          'Isochoric process: Volume constant, $W = 0$, $Q = \\Delta U$.',
          'Isobaric process: Pressure constant, $W = P\\Delta V$.',
        ],
      },
    ],
  },

  'Kinetic Theory': {
    intro: 'Kinetic Theory of Gases, Degrees of Freedom and Specific Heat',
    sections: [
      {
        title: 'Kinetic Theory of Gases: Assumptions',
        bullets: [
          'The molecules of a gas are identical, spherical and perfectly elastic point masses.',
          'The volume of molecules is negligible in comparison to the volume of gas.',
          'Molecules of a gas move randomly in all directions.',
          'The speed of gas molecules lie between zero and infinity.',
          'Their collisions are perfectly elastic.',
          'The number of collisions per unit volume in a gas remains constant.',
          'No attractive or repulsive force acts between gas molecules.',
        ],
      },
      {
        title: 'Pressure of an Ideal Gas',
        content: '$$P = \\frac{1}{3}\\rho V_{rms}^2 = \\frac{1}{3}\\frac{mN}{V}V_{rms}^2$$',
      },
      {
        title: 'Relation Between Pressure and Kinetic Energy',
        content: 'Kinetic energy per unit volume $E$: $$P = \\frac{2}{3}E, \\quad E = \\frac{1}{2}\\rho V_{rms}^2$$',
      },
      {
        title: 'Ideal Gas Equation',
        content: 'The equation relating pressure (P), volume (V) and temperature (T) of an ideal gas:',
        table: {
          headers: ['Condition', 'Equation'],
          rows: [
            ['For 1 mole or $N_A$ molecules', '$PV = RT$'],
            ['For $\\mu$ moles of gas', '$PV = \\mu RT$'],
            ['For 1 molecule of gas', '$PV = kT$'],
            ['For N molecules of gas', '$PV = NkT$'],
            ['For 1 gram of gas', '$PV = \\frac{R}{M}T = rT$'],
            ['For n grams of gas', '$PV = nrT$'],
          ],
        },
      },
      {
        title: 'Universal Gas Constant (R)',
        content: 'Dimensions: $[ML^2T^{-2}\\theta^{-1}]$. Signifies work done by (or on) a gas per mole per kelvin. $$R = 8.31 \\text{ J mol}^{-1}\\text{K}^{-1} = 1.98 \\text{ cal mol}^{-1}\\text{K}^{-1}$$',
      },
      {
        title: "Boltzmann's Constant (k)",
        content: '$$k_B = 1.38 \\times 10^{-23} \\text{ J/K}$$ Dimensions: $[ML^2T^{-2}\\theta^{-1}]$',
      },
      {
        title: 'Various Speeds of Gas Molecules',
        bullets: [
          'Root mean square speed: $V_{rms} = \\sqrt{\\frac{3P}{\\rho}} = \\sqrt{\\frac{3RT}{M}} = \\sqrt{\\frac{3kT}{m}}$',
          'Most probable speed: $V_{mp} = \\sqrt{\\frac{2P}{\\rho}} = \\sqrt{\\frac{2RT}{M}} = \\sqrt{\\frac{2kT}{m}}$',
          'Average speed: $V_{av} = \\sqrt{\\frac{8P}{\\pi\\rho}} = \\sqrt{\\frac{8RT}{\\pi M}} = \\sqrt{\\frac{8kT}{\\pi m}}$',
          'Order: $V_{rms} > V_{av} > V_{mp}$ (remembering trick: RAM)',
        ],
      },
      {
        title: 'Kinetic Energy of Ideal Gas',
        content: 'Molecules of ideal gases possess only translational motion, hence only translational kinetic energy.',
        table: {
          headers: ['Quantity of Gas', 'Kinetic Energy'],
          rows: [
            ['1 molecule', '$\\frac{3}{2}kT$'],
            ['1 mole (M gram)', '$\\frac{3}{2}RT$'],
            ['1 gram', '$\\frac{3}{2}rT$'],
          ],
        },
      },
      {
        title: 'Degree of Freedom',
        content: 'The total number of independent modes (ways) in which a system can possess energy is called the degree of freedom (f). $$f = 3N - R$$ where $N$ = number of independent particles, $R$ = number of independent restrictions.',
        bullets: [
          'Translational degree of freedom',
          'Rotational degree of freedom',
          'Vibrational degree of freedom',
          'Monoatomic gas: f = 3 (all translational).',
          'Diatomic gas: f = 5 (3 translational + 2 rotational).',
          'Triatomic non-linear: f = 6 (3 translational + 3 rotational).',
        ],
      },
      {
        title: 'Degree of Freedom Table',
        table: {
          headers: ['Atomicity', 'Example', 'N', 'R', 'f = 3N - R'],
          rows: [
            ['Monoatomic', 'He, Ne, Ar', '1', '0', '3'],
            ['Diatomic', 'H₂, O₂', '2', '1', '5'],
            ['Triatomic non-linear', 'H₂O', '3', '3', '6'],
            ['Triatomic linear', 'CO₂, BeCl₂', '3', '2', '7'],
          ],
        },
      },
      {
        title: 'Law of Equipartition of Energy',
        content: 'For any system in thermal equilibrium, the total energy is equally distributed among its various degrees of freedom. Energy associated with each molecule per degree of freedom: $$E = \\frac{1}{2}k_BT$$',
      },
      {
        title: 'Mean Free Path',
        content: 'The average distance travelled by a gas molecule between successive collisions: $$\\lambda = \\frac{1}{\\sqrt{2}\\pi n d^2}$$ where $d$ = diameter of the molecule, $n$ = number of molecules per unit volume.',
        bullets: [
          'For air molecules at STP: average speed $\\langle v \\rangle = 485$ m/s',
          'Density $n = 2.7 \\times 10^{25}$ m$^{-3}$',
          'Mean free path $\\lambda = 2.9 \\times 10^{-7}$ m $\\approx 1500d$',
        ],
      },
      {
        title: "Mayer's Formula",
        content: '$$C_p - C_v = R$$ Molar specific heat at constant pressure is always greater than at constant volume.',
      },
      {
        title: 'Specific Heat in Terms of Degree of Freedom',
        table: {
          headers: ['Quantity', 'Monoatomic', 'Diatomic', 'Triatomic non-linear', 'Triatomic linear'],
          rows: [
            ['Degree of freedom $f$', '3', '5', '6', '7'],
            ['$C_v = \\frac{f}{2}R$', '$\\frac{3}{2}R$', '$\\frac{5}{2}R$', '$3R$', '$\\frac{7}{2}R$'],
            ['$C_p = (\\frac{f}{2}+1)R$', '$\\frac{5}{2}R$', '$\\frac{7}{2}R$', '$4R$', '$\\frac{9}{2}R$'],
            ['$\\gamma = C_p/C_v$', '$\\frac{5}{3} = 1.67$', '$\\frac{7}{5} = 1.4$', '$\\frac{4}{3} = 1.33$', '$\\frac{9}{7} = 1.28$'],
            ['KE of 1 mole', '$\\frac{3}{2}RT$', '$\\frac{5}{2}RT$', '$3RT$', '$\\frac{7}{2}RT$'],
            ['KE of 1 molecule', '$\\frac{3}{2}kT$', '$\\frac{5}{2}kT$', '$3kT$', '$\\frac{7}{2}kT$'],
          ],
        },
      },
      {
        title: 'Molecular Nature of Matter',
        bullets: [
          'Boyle discovered his famous law in 1661, contributing to understanding of gas behaviour.',
          'The kinetic theory, explaining gas behaviour through rapidly moving atoms/molecules, was developed by Maxwell and Boltzmann in the 19th century.',
          "Feynman emphasized the importance of atoms: perpetual motion particles with attractive and repulsive forces.",
          'Dalton\'s model: elements are composed of identical atoms, different from atoms of other elements.',
        ],
      },
      {
        title: 'Gas Laws',
        bullets: [
          "Gay Lussac's Law: gas volumes combine in small integer ratios.",
          "Avogadro's Law: equal volumes of gases at equal temperature and pressure contain equal number of molecules.",
          "Dalton's Law of Partial Pressures: total pressure is sum of partial pressures, $P = P_1 + P_2 + \\cdots$",
          "Charles' Law: $V \\propto T$ at constant pressure.",
          "Boyle's Law: $PV = $ constant at constant temperature.",
        ],
      },
      {
        title: "Avogadro's Number",
        content: 'The number of molecules per mole of any gas: $$N_A = 6.02 \\times 10^{23} \\text{ mol}^{-1}$$ The number of molecules per unit volume is constant for all gases at the same temperature and pressure.',
      },
    ],
  },

  'Oscillations': {
    intro: 'Simple Harmonic Motion, Energy and Simple Pendulum',
    sections: [
      {
        title: 'Force Law for Simple Harmonic Motion',
        content: "The force acting on a particle in SHM using Newton's second law: $$F(t) = ma = -m\\omega^2 x(t)$$ Also represented as: $$F(t) = -kx(t)$$ where $k = m\\omega^2$",
      },
      {
        title: 'Angular Frequency in SHM',
        content: '$$\\omega = \\sqrt{\\frac{k}{m}}$$',
      },
      {
        title: 'Direction of Force in SHM',
        content: 'In SHM, the force is always directed towards the mean position and is known as the restoring force.',
      },
      {
        title: 'Definition of Simple Harmonic Motion',
        content: 'Simple harmonic motion is defined by its displacement equation or its force law. The two are equivalent and interconvertible by differentiation and integration. Displacement: $$x(t) = A\\cos(\\omega t + \\phi)$$',
      },
      {
        title: 'Linearity in SHM',
        content: 'The force in SHM is linearly proportional to displacement $x(t)$. A system under such a force is called a linear harmonic oscillator.',
      },
      {
        title: 'Non-Linear Oscillators',
        content: 'Non-linear oscillators have forces with additional terms proportional to higher powers of $x$, such as $x^2$, $x^3$, etc.',
      },
      {
        title: 'Role of Restoring Force',
        content: 'The restoring force directs the particle back to its mean position, ensuring continuous oscillation.',
      },
      {
        title: 'Energy in SHM — Kinetic and Potential Energies',
        content: 'Both energies vary between zero and their maximum values.',
        bullets: [
          'Velocity in SHM is periodic and zero at extreme displacement positions.',
          'Kinetic energy is zero at maximum displacement and maximum at mean position.',
          'Spring force is conservative; potential energy: $U = \\frac{1}{2}kx^2$',
          'Potential energy is zero at mean position and maximum at extreme displacements.',
          'Both KE and PE are always positive, peaking twice per SHM period.',
        ],
      },
      {
        title: 'Kinetic Energy in SHM',
        content: '$$K = \\frac{1}{2}m\\omega^2(A^2 - x^2)$$',
      },
      {
        title: 'Potential Energy in SHM',
        content: '$$U = \\frac{1}{2}kx^2 = \\frac{1}{2}m\\omega^2 x^2$$',
      },
      {
        title: 'Total Energy in SHM',
        content: 'Total mechanical energy is constant: $$E = K + U = \\frac{1}{2}m\\omega^2 A^2 = \\frac{1}{2}kA^2$$',
      },
      {
        title: "Galileo's Observation on Pendulum",
        content: 'Galileo measured oscillation periods of a swinging chandelier by comparing it to his pulse beats. This motion was recognised as periodic.',
      },
      {
        title: 'Simple Pendulum — Basics',
        content: 'A simple pendulum consists of a small bob of mass $m$ tied to an inextensible, massless string of length $L$, fixed to a rigid support and free to oscillate.',
      },
      {
        title: 'Pendulum Motion Components',
        content: 'Two forces act on the pendulum bob at angle $\\theta$:',
        bullets: [
          'Tension $T$ along the string.',
          'Gravitational force $mg$, with components $mg\\cos\\theta$ along the string and $mg\\sin\\theta$ perpendicular to it.',
          'Radial acceleration: $\\omega^2 L$ provided by net radial force $T - mg\\cos\\theta$.',
          'Tangential acceleration provided by $mg\\sin\\theta$.',
        ],
      },
      {
        title: 'Torque in Pendulum',
        content: 'Torque $\\tau$ about the support: $$\\tau = -L(mg\\sin\\theta)$$',
      },
      {
        title: 'Equation of Motion of Pendulum',
        content: "By Newton's law of rotational motion: $\\tau = I\\alpha$. For small $\\theta$, $\\sin\\theta \\approx \\theta$: $$\\alpha = -\\frac{mgL}{I}\\theta$$",
      },
      {
        title: 'Time Period of Simple Pendulum',
        content: 'The time period $T$ for a simple pendulum: $$T = 2\\pi\\sqrt{\\frac{L}{g}}$$',
        bullets: [
          'Independent of mass of the bob.',
          'Independent of amplitude (for small angles).',
          'Directly proportional to $\\sqrt{L}$.',
          'Inversely proportional to $\\sqrt{g}$.',
          'For small angles up to 20°, $\\sin\\theta \\approx \\theta$ in radians.',
        ],
      },
      {
        title: 'Spring-Mass System',
        content: 'For a spring-mass system, the time period: $$T = 2\\pi\\sqrt{\\frac{m}{k}}$$',
      },
      {
        title: 'Period and Frequency',
        content: 'Frequency $\\nu = 1/T$. Angular frequency $\\omega = 2\\pi\\nu = 2\\pi/T$.',
      },
    ],
  },

  'Waves': {
    intro: 'Wave Motion, Superposition and Doppler Effect',
    sections: [
      {
        title: 'Displacement Relation for a Progressive Wave',
        content: 'A travelling wave is described using a function depending on both position ($x$) and time ($t$): $$y(x,t) = a\\sin(kx - \\omega t + \\phi)$$',
        bullets: [
          '$a$: Amplitude of the wave',
          '$\\omega$: Angular frequency',
          '$k$: Angular wave number',
          '$kx - \\omega t + \\phi$: Phase of the wave',
        ],
      },
      {
        title: 'Wave Parameters',
        bullets: [
          'Wavelength: $\\lambda = 2\\pi/k$',
          'Time period: $T = 2\\pi/\\omega$',
          'Frequency: $\\nu = 1/T = \\omega/2\\pi$',
          'Wave speed: $v = \\lambda\\nu = \\omega/k$',
        ],
      },
      {
        title: 'Principle of Superposition of Waves',
        content: 'The net displacement during wave overlap is the algebraic sum of the displacements due to each individual wave: $$y = y_1 + y_2$$',
        bullets: [
          'Wave pulses retain their identity after crossing each other.',
          'While overlapping, the wave pattern differs from individual pulses.',
          'Each wave acts independently causing a combined net displacement.',
        ],
      },
      {
        title: 'Superposition of Two Harmonic Waves',
        content: 'Two harmonic waves with same frequency $\\omega$, same wave number $k$, equal amplitudes but different initial phases $\\phi_1$ and $\\phi_2$: $$y = 2a\\cos\\left(\\frac{\\phi_1-\\phi_2}{2}\\right)\\sin\\left(kx - \\omega t + \\frac{\\phi_1+\\phi_2}{2}\\right)$$',
      },
      {
        title: 'Reflection of Waves',
        bullets: [
          'Incident waves partially reflect and partially transmit at an elastic media boundary.',
          'Oblique incident wave refraction follows Snell\'s Law.',
          'Incident and reflected waves obey the standard reflection laws.',
          'At a rigid boundary: reflected pulse maintains shape but undergoes a 180° phase shift.',
          'At an open boundary: no phase change on reflection.',
        ],
      },
      {
        title: 'Standing Waves and Superposition',
        content: 'Standing waves arise from wave reflections at multiple boundaries. The equation of a standing wave: $$y = 2a\\sin(kx)\\cos(\\omega t)$$',
        bullets: [
          'Amplitude oscillations occur at fixed points.',
          'Each string segment vibrates in phase but with different amplitude.',
        ],
      },
      {
        title: 'Formation of Nodes and Antinodes',
        bullets: [
          'Nodes are points with zero amplitude; adjacent nodes are spaced $\\lambda/2$ apart.',
          'Antinodes exhibit maximum amplitude; adjacent antinodes spaced $\\lambda/2$ apart.',
          'Distance between a node and adjacent antinode is $\\lambda/4$.',
        ],
      },
      {
        title: 'Natural Frequencies and Harmonics',
        content: 'For a string of length $L$ fixed at both ends, natural frequencies: $$\\nu_n = \\frac{n}{2L}\\sqrt{\\frac{T}{\\mu}}, \\quad n = 1, 2, 3, \\ldots$$',
        bullets: [
          'Fundamental mode ($n=1$): lowest frequency.',
          'Second harmonic ($n=2$): twice the fundamental frequency.',
          'Constrained wavelengths lead to normal modes.',
        ],
      },
      {
        title: 'Air Columns — Open Pipe',
        content: 'For an open pipe of length $L$: $$\\nu_n = \\frac{nv}{2L}, \\quad n = 1, 2, 3, \\ldots$$',
        bullets: [
          'Antinodes at both open ends.',
          'All harmonics are present.',
        ],
      },
      {
        title: 'Air Columns — Closed Pipe',
        content: 'For a closed pipe (one end closed): $$\\nu_n = \\frac{(2n-1)v}{4L}, \\quad n = 1, 2, 3, \\ldots$$',
        bullets: [
          'Node at closed end, antinode at open end.',
          'Only odd harmonics are present.',
          'Nodes represent maximum pressure change but zero displacement at closed ends.',
          'Antinodes signify least pressure change and maximum displacement at open ends.',
        ],
      },
      {
        title: 'Beats',
        content: 'Beats occur due to interference of waves when two harmonic sound waves of close frequencies are heard together. $$\\nu_{beat} = |\\nu_1 - \\nu_2|$$',
        bullets: [
          'Beats are perceived as a waxing and waning of sound intensity.',
          'The beat frequency equals the difference in the two close frequencies.',
          'Musicians use beats to tune instruments — absence of beats means frequencies are harmonised.',
          'Example: waves at 11 Hz and 9 Hz produce beats at 2 Hz.',
        ],
      },
      {
        title: 'Speed of a Transverse Wave on a String',
        content: '$$v = \\sqrt{\\frac{T}{\\mu}}$$ where $T$ is tension in the string and $\\mu$ is mass per unit length.',
      },
      {
        title: 'Speed of Sound in a Medium',
        content: '$$v = \\sqrt{\\frac{B}{\\rho}}$$ where $B$ is the bulk modulus and $\\rho$ is the density. For an ideal gas: $$v = \\sqrt{\\frac{\\gamma P}{\\rho}} = \\sqrt{\\frac{\\gamma RT}{M}}$$',
      },
      {
        title: 'Doppler Effect',
        content: 'The apparent change in frequency due to relative motion between source and observer: $$\\nu\' = \\nu_0\\frac{v + v_o}{v - v_s}$$ where $v$ = speed of sound, $v_o$ = speed of observer, $v_s$ = speed of source.',
        bullets: [
          'Observer moving towards source: apparent frequency increases.',
          'Observer moving away from source: apparent frequency decreases.',
          'Applications: radar, sonar, medical ultrasound, astronomy.',
        ],
      },
      {
        title: 'Forced Oscillations and Resonance',
        content: 'Systems with external frequencies near natural frequencies exhibit resonance.',
        bullets: [
          'At resonance, amplitude of oscillation becomes maximum.',
          'This principle applies equally to strings and air columns.',
          'Found in musical instruments like tablas, where frequencies are derived from vibrational constraints.',
        ],
      },
    ],
  },


};

export default PhysicsNotes;