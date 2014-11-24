
BRUNCH = ./node_modules/.bin/brunch


clean:
	rm -f build --production
	
devel:
	$(BRUNCH) build --production
	cp app/assets/robots.txt.devel build/robots.txt
	cd build && rsync -avu --delete -e 'ssh -p22' . evaleto@evaletolab.ch:www/test.karibou.ch/

prod:
	$(BRUNCH) build --production
	cp app/assets/robots.txt.prod build/robots.txt
	cd build && rsync -avu --delete -e 'ssh -p22' . evaleto@evaletolab.ch:www/production.karibou.ch/

publish:
	$(BRUNCH) build --production
	cp app/assets/robots.txt.devel build/robots.txt
	cd build && rsync -avu --delete -e 'ssh -p22' . evaleto@evaletolab.ch:www/test.karibou.ch/
	cp app/assets/robots.txt.prod build/robots.txt
	cd build && rsync -avu --delete -e 'ssh -p22' . evaleto@evaletolab.ch:www/production.karibou.ch/


.PHONY: docs clean publish
