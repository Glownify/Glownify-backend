export const geoNearStage = ({ lat, lng, radius = 5 }) => {
  if (!lat || !lng) return [];

  return [
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        distanceField: "distanceInMeters",
        maxDistance: parseFloat(radius) * 1000,
        spherical: true,
      },
    },
  ];
};
