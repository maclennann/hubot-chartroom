=== CONTRIBUTING ===

I am more than happy to review and accept pull requests for bugfixes and
additional features.

==== Contributing Code ====

The contributor workflow should be fairly standard and familiar to open source
contributors:

1. Fork this repository
2. Create a feature branch for your changes (or don't, it's your fork)
3. Make your changes.
4. Add/alter unit tests where applicable
    * Please try to keep test coverage high. 100% is a tough number to give up.
    * Especially make use of the `hubot-mock-adapter` where you can
    * And please keep them unit tests through judicious use of mocking.
5. Run `npm run-script preflight`
    * This will run unit tests with coverage, and `JSLint`
    * It also runs `sloc` just for fun.
6. Push your changes and file a Pull Request
    * If I'm not incompetent, Travis should build it for you
    * Then I'll come along and review/merge at some point shortly

==== Code Style ====

Basically, just make sure `JSLint` is happy. If you think it's necessary feel free
to tell it to ignore some things. NBD.

Architecturally, I generally prefer promises over callbacks, so keep that in mind.
But this is such a small project that I won't really pay it much mind if you prefer
callbacks.
