# comicVM 

# How to create a comic

  Open a new scene of a new story

 ## Create a plot

  Every scene is defined by a plot.
  A plot is a sequence of actions described by statements that answer the question:
    who says or does what?
  and optionally the further question:
    how?

  comicVM parses the plot text into plot items, that you can see in the panel info pane.

  [Examples]

 # Create a layout

  To bring the plot on the page we need to define a layout.

  The layout of a scene is a list of pages.
  a page is a list of strips (height is distributed evenly or as specified by hStrip)
  a strip is a list of panels (width is distributed evenly or as specified by wPanel).
  each panel contains a list of property values.
  the name of these properties is specified in the layout property named "panelProperties",
  so panel [2, "beach"] specifies
   plotItemCount = 2,
   bgrQualifier = "beach"

  So what do these panel properties mean?

  - plotItemCount specifies the number of plot items to display in a panel
  - bgrQualifier specifies the background image to display
  - zoom / pan: move camera
  - characterPositions: scale and offset

  these properties can not only be applied to a single panel
  but to all panels of a background or the whole scene.


- Lets look at the effect of all these properties

 # The Panel Layout

Each panel layout is based on a simple default, the most natural and neutral layout we can immagine:

Default Panel Layout:
  characters are aligned horizontally and placed inside the panel such
  that all acting* characters are well visible (gaps to border and next character is one character width)

An acting character is one who does or says something in one of the displayed plot items,
or is mentioned as "together with" an acting character.

This default layout can now be customized each panel, background or scene.
But before we specify where exactly to paint something, we need to know *what* to paint.


 # Images

comicVM combines images of background and characters.
all images are taken from a tag-store.
you throw in some keywords (tags) and get back the image with the best matching name.

This principle that the most specific match wins serves the purpose of defaults.
an unspecific match can represent the character in any scene,
better matching images can be added any time to overwrite the unspecific default.

 # Which Image to paint

The image tags are:

  ## background:
        place

  ## character:
        name
        how
        place
        say
        reverse
        ?

Must match vs. nice to have

 # Where to paint the image

  ## Size and Position of characters

  ## Size and Position of the background image

[
 # plotItemCount
    specifies the number of plot items to display in a panel
 # bgrQualifier
    specifies the background image to display
 # zoom / pan: move camera
 # characterPositions: scale and offset
]
