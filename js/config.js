// Remember Me - Configuration
export const CONFIG = {
  dimensions: {
    margin: { top: 280, right: 100, bottom: 350, left: 100 }
  },
  
  timeline: {
    yearRange: [1770, 1815],
    dotRadius: 5,
    dotSpacing: 12
  },
  
  animation: {
    transitionDuration: 250  // Snappy chart animations
  },
  
  tooltip: {
    thumbnailSize: 83,
    edgePadding: 80
  },
  
  categories: {
    size: {
      name: "Size",
      groups: ["Miniature", "Regular"],
      getValue: (d) => {
        const size = d.size.toLowerCase();
        return (size.includes("miniature") || size.includes("mini")) ? "Miniature" : "Regular";
      }
    },
    artist: {
      name: "Artist",
      groups: ["Known", "Unknown"],
      getValue: (d) => (d.artist && d.artist.trim() !== "") ? "Known" : "Unknown"
    },
    sitter: {
      name: "Sitter",
      groups: ["Named", "Unnamed"],
      getValue: (d) => (d.sitter && d.sitter.trim() !== "") ? "Named" : "Unnamed"
    },
    gender: {
      name: "Gender",
      groups: ["Male", "Female"],
      getValue: (d) => {
        const gender = d.gender;
        if (gender === "female" || gender === "f") return "Female";
        if (gender === "male" || gender === "m") return "Male";
        return "Male";
      }
    }
  }
};
