
// export const geoNearStage = ({ lat, lng, radius = 25 }) => { // radius in km
//   // if (!lat || !lng) return [];
//   if (lat == null || lng == null) return [];

//   return [
//     {
//       $geoNear: {
//         near: {
//           type: "Point",
//           coordinates: [parseFloat(lng), parseFloat(lat)],
//         },
//         distanceField: "distanceInMeters",
//         maxDistance: parseFloat(radius) * 1000,
//         spherical: true,
//       },
//     },
//   ];
// };


// radius in km, if radius is not provided then it will return all nearby salons sorted by distance
export const geoNearStage = ({ lat, lng, radius }) => {
  // if (!lat || !lng) return [];
  if (lat == null || lng == null) return [];

  const geoNear = {
    $geoNear: {
      near: {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      distanceField: "distanceInMeters",
      spherical: true,
    },
  };

  // if radius pass then only add maxDistance
  if (radius) {
    geoNear.$geoNear.maxDistance = parseFloat(radius) * 1000;
  }

  return [geoNear];
};
