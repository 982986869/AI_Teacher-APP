// src/notes/images/notesImages.js
//
// This file lives in the SAME folder as the .jpg images,
// so each require() points to './filename.jpg' (no 'images/' prefix).

const notesImages = {
  // ── Chapter 8: Straight Lines ───────────────────────────────
  sl_internal_division: require('./sl_internal_division.jpg'),
  sl_external_division: require('./sl_external_division.jpg'),
  sl_inclination:       require('./sl_inclination.jpg'),
  sl_slope_two_points:  require('./sl_slope_two_points.jpg'),
  sl_horizontal_lines:  require('./sl_horizontal_lines.jpg'),
  sl_vertical_lines:    require('./sl_vertical_lines.jpg'),
  sl_point_slope:       require('./sl_point_slope.jpg'),
  sl_two_point:         require('./sl_two_point.jpg'),
  sl_slope_intercept:   require('./sl_slope_intercept.jpg'),
  sl_through_origin:    require('./sl_through_origin.jpg'),
  sl_intercept_form:    require('./sl_intercept_form.jpg'),

  // ── Chapter 9: Conic Sections ───────────────────────────────
  circle_general:       require('./circle_general.jpg'),
  circle_origin:        require('./circle_origin.jpg'),
  parabola_parts:       require('./parabola_parts.jpg'),
  parabola_right:       require('./parabola_right.jpg'),
  parabola_left:        require('./parabola_left.jpg'),
  parabola_up:          require('./parabola_up.jpg'),
  parabola_down:        require('./parabola_down.jpg'),
  ellipse_x:            require('./ellipse_x.jpg'),
  ellipse_y:            require('./ellipse_y.jpg'),
  hyperbola_x:          require('./hyperbola_x.jpg'),
  hyperbola_conjugate:  require('./hyperbola_conjugate.jpg'),

  // ── Chapter 10: Introduction to 3D Geometry ─────────────────
  octants_3d:           require('./octants_3d.jpg'),

  // ── Chapters 1–6: uncomment once the .jpg files are added ───
  // open_interval:      require('./open_interval.jpg'),
  // half_open_left:     require('./half_open_left.jpg'),
  // half_open_right:    require('./half_open_right.jpg'),
  // venn_universal:     require('./venn_universal.jpg'),
  // venn_intersection:  require('./venn_intersection.jpg'),
  // venn_intersection3: require('./venn_intersection3.jpg'),
  // venn_difference:    require('./venn_difference.jpg'),
  // venn_ab_parts:      require('./venn_ab_parts.jpg'),
  // venn_complement:    require('./venn_complement.jpg'),
  // cartesian_product:  require('./cartesian_product.jpg'),
  // positive_angle:     require('./positive_angle.jpg'),
  // negative_angle:     require('./negative_angle.jpg'),
  // radian_circle:      require('./radian_circle.jpg'),
  // trig_values_table:  require('./trig_values_table.jpg'),
};

export default notesImages;