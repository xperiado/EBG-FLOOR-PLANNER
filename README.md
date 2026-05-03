# Elevated Building Planner

A lightweight browser-based MVP for sketching remodeling floor plans.

## Features

- Add room blocks with names, dimensions, placement, and colors
- Drag rooms around a gridded canvas
- Edit or delete the selected room from the inspector
- Live room count and total square footage
- Export and import plans as JSON
- Import LiDAR/room scan data into the active floor
  - iPhone and iPad: RoomPlan/CapturedRoom-style JSON exports
  - Android: ARCore/WebXR-style JSON or CSV point clouds
  - Generic measured JSON: rooms, walls, doors, windows, and fixtures
- Load a sample remodeling layout to demo the workflow

## Run it

Open [index.html](./index.html) in a browser.

Because the app is dependency-free, there is nothing to install for this first version.

## Good next steps

- Add walls, doors, and windows
- Snap room edges together
- Support multi-floor projects
- Generate printable estimate sheets and client PDFs
