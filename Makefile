
BRUNCH = ./node_modules/.bin/brunch


clean:
	rm -f build 

syncprod:
	cp app/assets/robots.txt.prod build/robots.txt
	cd build && rsync -avu --delete -e 'ssh -p22' . evaleto@evaletolab.ch:www/admin.karibou.ch/

syncdev:
	cp app/assets/robots.txt.devel build/robots.txt
	cd build && rsync -avu --delete -e 'ssh -p22' . evaleto@evaletolab.ch:www/testadmin.karibou.ch/

devel:
	$(BRUNCH) build --production
	cp app/assets/robots.txt.devel build/robots.txt
	cd build && rsync -avu --delete -e 'ssh -p22' . evaleto@evaletolab.ch:www/testadmin.karibou.ch/

prod:
	$(BRUNCH) build --production
	cp app/assets/robots.txt.prod build/robots.txt
	cp app/assets/google686735a81b08a83b.html build/
	cd build && rsync -avu --delete -e 'ssh -p22' . evaleto@evaletolab.ch:www/admin.karibou.ch/

publish:
	$(BRUNCH) build --production
	cp app/assets/robots.txt.devel build/robots.txt
	cd build && rsync -avu --delete -e 'ssh -p22' . evaleto@evaletolab.ch:www/testadmin.karibou.ch/
	cp app/assets/robots.txt.prod build/robots.txt
	cd build && rsync -avu --delete -e 'ssh -p22' . evaleto@evaletolab.ch:www/admin.karibou.ch/


.PHONY: docs clean publish
