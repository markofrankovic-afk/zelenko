# Gruba granica Gorskog kotara (lon, lat) s rubom; uz filtar države = Hrvatska.
POLIGON = [(14.55,45.64),(14.555,45.45),(14.58,45.36),(14.62,45.32),(14.64,45.27),(14.74,45.22),
           (14.92,45.17),(15.07,45.15),(15.13,45.26),(15.24,45.32),(15.25,45.44),(15.10,45.50),
           (14.85,45.50),(14.70,45.55),(14.62,45.66)]
def unutra(lon, lat, P=POLIGON):
    c = False; j = len(P) - 1
    for i in range(len(P)):
        xi, yi = P[i]; xj, yj = P[j]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi: c = not c
        j = i
    return c
