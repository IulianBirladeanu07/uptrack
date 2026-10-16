# Backend structure notes

## Nutrition: frequent foods

The food category builder groups meals by a stable food identity rather than by meal slot. That keeps repeated items such as the same oat product across breakfast and lunch in one frequent-food bucket, while still counting each separate use as a usage event. When two foods have the same total count, the more recently used one wins the tie-breaker.

## Progress: lift identity

Workout summaries normalize lift identity by exercise name and resolved muscle group. If a same-named exercise has only one known group across the recorded workouts, missing group data is filled from that single known value so the lift is treated as one continuous series. If the same name appears under multiple muscle groups, those lifts remain separate.
