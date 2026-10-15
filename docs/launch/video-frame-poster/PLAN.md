# Video frame posters

Add an inline frame picker to each Content Hub video. Support a native video preview, scrubber, hundredth-second time entry, explicit confirmation and cancellation. Capture the currently decoded paused frame as a bounded JPEG, normalize and store it through the existing authorized image upload flow, and attach the returned image ID as the selected video's poster. Keep Files/manual poster choices.

Verify second-video targeting, real MOV seeking/capture, normalized image dimensions, cancel and failure recovery, responsive layout, source preservation, upload constraints, full unit/type/lint/security/build and hosted SQL/CI gates. Group Files preview signing by the actual asset bucket so generated posters remain usable alongside original videos. No new endpoint, dependency or migration. Deploy the validated shared dashboard live; do not save/publish Scar's posts or promote her full site.
