push_v1:
	npm run build && \
	git add -A && \
	git commit --amend && \
	git tag -d v1 && \
	git tag -a v1 -m 'v1' && \
	git push -f && \
	git push --delete origin v1 && \
	git push --tags
